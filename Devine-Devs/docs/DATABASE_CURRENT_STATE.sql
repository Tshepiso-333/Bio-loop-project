-- BioLoop — current database state snapshot
-- Generated 2026-07-27, replacing docs/migrations/001-032 (deleted — that
-- numbered history is superseded by this single snapshot of what's actually
-- live on the Supabase project right now). For table/column definitions, see
-- docs/SCHEMA.md — this file only covers what migrations actually changed:
-- custom enums, SECURITY DEFINER helper functions, views, and every RLS
-- policy currently active. Not necessarily a runnable script top-to-bottom
-- (some CREATE TYPE statements would need IF NOT EXISTS guards to be safe to
-- rerun) — it's a reference snapshot, not a fresh-install script.

-- ============================================================
-- ENUMS (app-specific; excludes Supabase/Postgres built-ins)
-- ============================================================
-- app_role:            restaurant, collector, manufacturer, admin
-- user_status:         active, inactive, pending
-- pickup_status:       pending, assigned (legacy, treat as pending), scheduled,
--                      in_transit, arrival, in_progress (legacy, superseded by collected),
--                      collected, arrived_manufacturer, completed, cancelled
-- pickup_type:         auto, manual, scheduled
-- urgency_level:       standard, urgent
-- quality_grade:       A, B, C
-- alert_category:      inventory, delivery, quality, info
-- device_connectivity: strong, weak, offline
-- sediment_level:      low, medium, high
-- schedule_frequency:  weekly, biweekly, monthly
-- activity_badge_type: percent, label, money

-- ============================================================
-- VIEWS (security_invoker — RLS of underlying tables still applies)
-- ============================================================

-- restaurant_wallets/collector_wallets tables were dropped (stored .balance,
-- never kept in sync). Replaced with these, computed live from earnings:

CREATE OR REPLACE VIEW public.restaurant_balances
WITH (security_invoker = true) AS
SELECT r.id AS restaurant_id,
    COALESCE(sum(e.amount) FILTER (WHERE e.withdrawal_id IS NULL), 0::numeric) AS balance
FROM restaurants r
LEFT JOIN earnings e ON e.restaurant_id = r.id
GROUP BY r.id;

CREATE OR REPLACE VIEW public.collector_balances
WITH (security_invoker = true) AS
SELECT c.id AS collector_id,
    COALESCE(sum(e.amount) FILTER (WHERE e.withdrawal_id IS NULL), 0::numeric) AS balance
FROM collectors c
LEFT JOIN earnings e ON e.collector_id = c.id
GROUP BY c.id;

-- ============================================================
-- SECURITY DEFINER helper functions
-- ============================================================
-- These exist specifically to break circular RLS evaluation: whenever one
-- role's policy needs to check something on a table whose own policy checks
-- back, a SECURITY DEFINER function bypasses RLS internally and terminates
-- the cycle at exactly one point. Never write the equivalent check as a raw
-- inline subquery in a policy on the table being checked FROM — that's what
-- caused "infinite recursion detected" incidents on both profiles (early on)
-- and restaurants/pickups (2026-07-26).

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.my_restaurant_ids()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT id FROM public.restaurants WHERE owner_user_id = auth.uid(); $$;

CREATE OR REPLACE FUNCTION public.my_manufacturer_ids()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT id FROM public.manufacturers WHERE owner_user_id = auth.uid(); $$;

CREATE OR REPLACE FUNCTION public.my_collector_pickup_restaurant_ids()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  select p.restaurant_id from pickups p
  join collectors c on c.id = p.collector_id
  where c.owner_user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.my_collector_pickup_manufacturer_ids()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  select p.manufacturer_id from pickups p
  join collectors c on c.id = p.collector_id
  where c.owner_user_id = auth.uid();
$$;

-- Fires on every new auth.users row. Inserts the profiles row AND the
-- matching role-table row (collectors/restaurants/manufacturers) — before
-- migration 025 this only inserted profiles, silently breaking every real
-- signup until manually patched.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
declare
  resolved_role app_role;
  owner_name text;
begin
  resolved_role := case
    when (new.raw_user_meta_data->>'role') in ('restaurant', 'collector', 'manufacturer')
      then (new.raw_user_meta_data->>'role')::app_role
    else 'restaurant'::app_role
  end;

  insert into public.profiles (id, email, role, full_name, status)
  values (
    new.id, new.email, resolved_role,
    trim(concat(new.raw_user_meta_data->>'name', ' ', new.raw_user_meta_data->>'surname')),
    'active'::user_status
  );

  owner_name := nullif(trim(concat(new.raw_user_meta_data->>'name', ' ', new.raw_user_meta_data->>'surname')), '');
  owner_name := coalesce(owner_name, split_part(new.email, '@', 1));

  if resolved_role = 'collector' then
    insert into public.collectors (owner_user_id, full_name) values (new.id, owner_name);
  elsif resolved_role = 'restaurant' then
    insert into public.restaurants (owner_user_id, name) values (new.id, owner_name);
  elsif resolved_role = 'manufacturer' then
    insert into public.manufacturers (owner_user_id, name) values (new.id, owner_name);
  end if;

  return new;
end;
$$;

-- ============================================================
-- RLS POLICIES — every policy currently active, by table
-- ============================================================
-- Every table has RLS enabled. Shorthand below: "owner" = owner_user_id
-- matches auth.uid() on that role's own table; "admin" = is_admin().

-- profiles
--   profiles_select_own  (select): self OR admin
--   profiles_update_own  (update): self OR admin
--   profiles_admin_insert (insert): admin
--   profiles_admin_delete (delete): admin

-- restaurants
--   restaurants_select (select): owner OR (manufacturer whose id = restaurants.primary_manufacturer_id)
--                                 OR (id IN my_collector_pickup_restaurant_ids()) OR admin
--   restaurants_insert (insert): owner OR admin
--   restaurants_update (update): owner OR admin
--   restaurants_delete (delete): owner OR admin

-- collectors
--   collectors_access (all): owner OR admin

-- manufacturers
--   manufacturers_access (all) using: owner OR (id IN my_collector_pickup_manufacturer_ids()) OR admin
--                          with check: owner OR admin  -- collector visibility is read-only by design

-- tanks
--   tanks_access (all): (manufacturer owner via tanks.manufacturer_id) OR (restaurant owner via tanks.restaurant_id) OR admin

-- pickups  (the hub table — most complex policy set)
--   pickups_select (select): restaurant owner OR manufacturer owner OR collector owner OR admin
--   pickups_restaurant_insert (insert): restaurant owner OR admin
--   pickups_update (update) using: collector owner OR manufacturer owner OR admin
--                  with check: collector owner OR manufacturer owner
--                              OR (collector_id IS NULL AND status = 'pending')  -- allows declinePickup's post-decline row shape
--                              OR admin
--   pickups_admin_delete (delete): admin

-- manual_pickup_requests
--   manual_pickup_requests_restaurant_select (select): restaurant_id IN my_restaurant_ids()
--   manual_pickup_requests_restaurant_insert (insert): restaurant_id IN my_restaurant_ids()
--   manual_pickup_requests_admin_access (all): admin

-- quality_logs
--   quality_logs_restaurant_select (select): restaurant_id IN my_restaurant_ids()
--   quality_logs_admin_access (all): admin

-- market_rates
--   market_rates_read (select): any authenticated user
--   market_rates_admin_insert/update/delete: admin

-- earnings
--   earnings_access (all): restaurant owner (via restaurant_id) OR collector owner (via collector_id)
--                          OR (manufacturer owner of the pickup via pickup_id → pickups.manufacturer_id) OR admin
--                          -- manufacturer case added 2026-07-27: their own client inserts these rows on
--                          -- payment confirmation and was never a recognized writer before that

-- withdrawals
--   withdrawals_access (all): restaurant owner OR collector owner OR admin

-- alerts
--   alerts_access (all): user_id = auth.uid() OR admin

-- ai_chat_messages
--   ai_chat_messages_access (all): user_id = auth.uid() OR admin

-- tank_readings
--   tank_readings_select (select): tank belongs to a restaurant in my_restaurant_ids() OR admin
--   tank_readings_admin_insert/update/delete: admin

-- activity_logs
--   activity_logs_select (select): restaurant_id IN my_restaurant_ids() OR admin
--   activity_logs_admin_insert/update/delete: admin

-- pickup_schedules
--   pickup_schedules_select/insert/update: restaurant_id IN my_restaurant_ids() OR admin
--   pickup_schedules_admin_delete: admin

-- manufacturer_inventory
--   manufacturer_inventory_select (select): manufacturer_id IN my_manufacturer_ids() OR admin
--   manufacturer_inventory_admin_insert/update/delete: admin

-- forecasts
--   forecasts_select (select): manufacturer_id IN my_manufacturer_ids() OR admin
--   forecasts_admin_insert/update/delete: admin

-- platform_settings
--   platform_settings_read_all (select): true (any authenticated user can read commission/rate settings)
--   platform_settings_admin_insert/update/delete: admin

-- payment_transactions
--   payment_transactions_select (select): manufacturer owner OR admin  -- READ ONLY for the app;
--                                          all writes happen inside the payfast-checkout/payfast-itn
--                                          Edge Functions via the service-role key, never the anon key.
