-- First restaurant module database layer.
-- Run this in Supabase SQL Editor or with the Supabase CLI.

create extension if not exists pgcrypto;

do $$
begin
  create type public.user_role as enum ('restaurant', 'driver', 'manufacturer', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.oil_quality_grade as enum ('A', 'B', 'C', 'unknown');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.sensor_device_status as enum ('active', 'inactive', 'maintenance');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.collection_request_type as enum ('manual', 'automatic');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.collection_request_status as enum (
    'pending',
    'scheduled',
    'assigned',
    'in_progress',
    'completed',
    'cancelled'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role public.user_role not null default 'restaurant',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  business_name text not null,
  contact_name text,
  contact_phone text,
  registration_number text,
  vat_number text,
  address_line_1 text,
  address_line_2 text,
  city text,
  province text,
  postal_code text,
  country text not null default 'South Africa',
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint restaurants_latitude_range check (latitude is null or latitude between -90 and 90),
  constraint restaurants_longitude_range check (longitude is null or longitude between -180 and 180)
);

create table if not exists public.tanks (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null default 'Tank 01',
  capacity_litres numeric(10, 2) not null,
  collection_threshold_percentage numeric(5, 2) not null default 80,
  is_active boolean not null default true,
  installed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tanks_capacity_litres_positive check (capacity_litres > 0),
  constraint tanks_collection_threshold_range check (
    collection_threshold_percentage > 0
    and collection_threshold_percentage <= 100
  )
);

create table if not exists public.sensor_devices (
  id uuid primary key default gen_random_uuid(),
  tank_id uuid not null references public.tanks(id) on delete cascade,
  device_identifier text not null unique,
  device_name text,
  is_simulated boolean not null default true,
  status public.sensor_device_status not null default 'active',
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, tank_id)
);

create table if not exists public.sensor_readings (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null,
  tank_id uuid not null,
  recorded_at timestamptz not null default now(),
  fill_percentage numeric(5, 2) not null,
  volume_litres numeric(10, 2) not null,
  temperature_celsius numeric(5, 2),
  quality_grade public.oil_quality_grade not null default 'unknown',
  created_at timestamptz not null default now(),
  constraint sensor_readings_device_tank_fk
    foreign key (device_id, tank_id)
    references public.sensor_devices(id, tank_id)
    on delete cascade,
  constraint sensor_readings_fill_percentage_range check (
    fill_percentage >= 0
    and fill_percentage <= 100
  ),
  constraint sensor_readings_volume_litres_non_negative check (volume_litres >= 0)
);

create table if not exists public.collection_requests (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  tank_id uuid references public.tanks(id) on delete set null,
  requested_by uuid references public.profiles(id) on delete set null,
  trigger_reading_id uuid references public.sensor_readings(id) on delete set null,
  request_type public.collection_request_type not null,
  status public.collection_request_status not null default 'pending',
  requested_pickup_date date,
  requested_time_slot text,
  urgency text,
  reason text,
  notes text,
  estimated_volume_litres numeric(10, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint collection_requests_estimated_volume_non_negative check (
    estimated_volume_litres is null
    or estimated_volume_litres >= 0
  ),
  constraint collection_requests_manual_or_automatic_check check (
    (request_type = 'manual' and requested_by is not null)
    or (request_type = 'automatic' and trigger_reading_id is not null)
  )
);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text := lower(coalesce(new.raw_user_meta_data ->> 'role', 'restaurant'));
  profile_role public.user_role;
begin
  profile_role :=
    case requested_role
      when 'driver' then 'driver'::public.user_role
      when 'manufacturer' then 'manufacturer'::public.user_role
      when 'admin' then 'admin'::public.user_role
      else 'restaurant'::public.user_role
    end;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    profile_role
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    role = excluded.role,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create index if not exists profiles_role_idx
  on public.profiles(role);

create index if not exists restaurants_owner_id_idx
  on public.restaurants(owner_id);

create index if not exists tanks_restaurant_id_idx
  on public.tanks(restaurant_id);

create index if not exists sensor_devices_tank_id_idx
  on public.sensor_devices(tank_id);

create index if not exists sensor_readings_tank_recorded_at_idx
  on public.sensor_readings(tank_id, recorded_at desc);

create index if not exists collection_requests_restaurant_status_idx
  on public.collection_requests(restaurant_id, status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_restaurants_updated_at on public.restaurants;
create trigger set_restaurants_updated_at
before update on public.restaurants
for each row execute function public.set_updated_at();

drop trigger if exists set_tanks_updated_at on public.tanks;
create trigger set_tanks_updated_at
before update on public.tanks
for each row execute function public.set_updated_at();

drop trigger if exists set_sensor_devices_updated_at on public.sensor_devices;
create trigger set_sensor_devices_updated_at
before update on public.sensor_devices
for each row execute function public.set_updated_at();

drop trigger if exists set_collection_requests_updated_at on public.collection_requests;
create trigger set_collection_requests_updated_at
before update on public.collection_requests
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.restaurants enable row level security;
alter table public.tanks enable row level security;
alter table public.sensor_devices enable row level security;
alter table public.sensor_readings enable row level security;
alter table public.collection_requests enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Restaurant owners can read their restaurants" on public.restaurants;
create policy "Restaurant owners can read their restaurants"
on public.restaurants
for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists "Restaurant owners can create restaurants" on public.restaurants;
create policy "Restaurant owners can create restaurants"
on public.restaurants
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "Restaurant owners can update their restaurants" on public.restaurants;
create policy "Restaurant owners can update their restaurants"
on public.restaurants
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "Restaurant owners can read their tanks" on public.tanks;
create policy "Restaurant owners can read their tanks"
on public.tanks
for select
to authenticated
using (
  exists (
    select 1
    from public.restaurants r
    where r.id = tanks.restaurant_id
      and r.owner_id = auth.uid()
  )
);

drop policy if exists "Restaurant owners can manage their tanks" on public.tanks;
create policy "Restaurant owners can manage their tanks"
on public.tanks
for all
to authenticated
using (
  exists (
    select 1
    from public.restaurants r
    where r.id = tanks.restaurant_id
      and r.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.restaurants r
    where r.id = tanks.restaurant_id
      and r.owner_id = auth.uid()
  )
);

drop policy if exists "Restaurant owners can read their sensor devices" on public.sensor_devices;
create policy "Restaurant owners can read their sensor devices"
on public.sensor_devices
for select
to authenticated
using (
  exists (
    select 1
    from public.tanks t
    join public.restaurants r on r.id = t.restaurant_id
    where t.id = sensor_devices.tank_id
      and r.owner_id = auth.uid()
  )
);

drop policy if exists "Restaurant owners can manage simulated sensor devices" on public.sensor_devices;
create policy "Restaurant owners can manage simulated sensor devices"
on public.sensor_devices
for all
to authenticated
using (
  exists (
    select 1
    from public.tanks t
    join public.restaurants r on r.id = t.restaurant_id
    where t.id = sensor_devices.tank_id
      and r.owner_id = auth.uid()
  )
)
with check (
  is_simulated = true
  and exists (
    select 1
    from public.tanks t
    join public.restaurants r on r.id = t.restaurant_id
    where t.id = sensor_devices.tank_id
      and r.owner_id = auth.uid()
  )
);

drop policy if exists "Restaurant owners can read their sensor readings" on public.sensor_readings;
create policy "Restaurant owners can read their sensor readings"
on public.sensor_readings
for select
to authenticated
using (
  exists (
    select 1
    from public.tanks t
    join public.restaurants r on r.id = t.restaurant_id
    where t.id = sensor_readings.tank_id
      and r.owner_id = auth.uid()
  )
);

drop policy if exists "Restaurant owners can create simulated sensor readings" on public.sensor_readings;
create policy "Restaurant owners can create simulated sensor readings"
on public.sensor_readings
for insert
to authenticated
with check (
  exists (
    select 1
    from public.tanks t
    join public.restaurants r on r.id = t.restaurant_id
    join public.sensor_devices d on d.id = sensor_readings.device_id
    where t.id = sensor_readings.tank_id
      and d.tank_id = t.id
      and d.is_simulated = true
      and r.owner_id = auth.uid()
  )
);

drop policy if exists "Restaurant owners can read their collection requests" on public.collection_requests;
create policy "Restaurant owners can read their collection requests"
on public.collection_requests
for select
to authenticated
using (
  exists (
    select 1
    from public.restaurants r
    where r.id = collection_requests.restaurant_id
      and r.owner_id = auth.uid()
  )
);

drop policy if exists "Restaurant owners can create collection requests" on public.collection_requests;
create policy "Restaurant owners can create collection requests"
on public.collection_requests
for insert
to authenticated
with check (
  exists (
    select 1
    from public.restaurants r
    where r.id = collection_requests.restaurant_id
      and r.owner_id = auth.uid()
  )
);
