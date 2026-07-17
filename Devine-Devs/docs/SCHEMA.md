# BioLoop — Database Schema Reference

Authoritative column names for all Supabase tables. **Use these exact names** in services, queries, and `dbColumns.js`.

**Do not use:** `scheduled_at`, `available_balance`, `price_per_liter` on earnings, `oil_grade` on quality_logs, `updated_at` on tanks, `name` on collectors.

---

## `profiles`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary — equals `auth.users.id` |
| `email` | `text` | Unique |
| `role` | `app_role` | `restaurant` / `collector` / `manufacturer` / `admin` |
| `full_name` | `text` | Nullable |
| `phone` | `text` | Nullable |
| `status` | `user_status` | |
| `created_at` | `timestamptz` | Nullable |
| `updated_at` | `timestamptz` | Nullable |

---

## `restaurants`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary |
| `owner_user_id` | `uuid` | Links to `profiles.id` |
| `name` | `text` | |
| `address` | `text` | Nullable |
| `district` | `text` | Nullable |
| `cuisine` | `text` | Nullable |
| `latitude` | `numeric` | Nullable |
| `longitude` | `numeric` | Nullable |
| `phone` | `text` | Nullable |
| `email` | `text` | Nullable |
| `image_url` | `text` | Nullable |
| `status` | `user_status` | |
| `created_at` | `timestamptz` | Nullable |
| `updated_at` | `timestamptz` | Nullable |

---

## `collectors`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary |
| `owner_user_id` | `uuid` | Links to `profiles.id` |
| `full_name` | `text` | Use this — not `name` |
| `employee_code` | `text` | Nullable Unique |
| `district` | `text` | Nullable |
| `route_name` | `text` | Nullable |
| `vehicle_info` | `text` | Nullable |
| `rating` | `numeric` | Nullable |
| `reviews_count` | `int4` | Nullable |
| `total_liters` | `numeric` | Nullable |
| `co2_saved_kg` | `numeric` | Nullable |
| `total_collections` | `int4` | Nullable |
| `status` | `user_status` | |
| `created_at` | `timestamptz` | Nullable |
| `updated_at` | `timestamptz` | Nullable |

---

## `manufacturers`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary |
| `owner_user_id` | `uuid` | Links to `profiles.id` |
| `name` | `text` | |
| `address` | `text` | Nullable |
| `contact_phone` | `text` | Nullable |
| `contact_email` | `text` | Nullable |
| `position` | `text` | Nullable |
| `status` | `user_status` | |
| `created_at` | `timestamptz` | Nullable |
| `updated_at` | `timestamptz` | Nullable |

---

## `tanks`

Shared by both restaurants and manufacturers — mirrors the owner-FK pattern
`pickups` uses (nullable FKs per owner type, exactly one set). A restaurant
tank has `restaurant_id` set and `manufacturer_id` null; a manufacturer tank
has `manufacturer_id` set and `restaurant_id` null. Enforced by a check
constraint (`tanks_owner_check`). See `docs/migrations/001_merge_manufacturer_tanks.sql`.

Manufacturer-owned rows currently leave the sensor columns
(`temperature_f`, `connectivity`, `sediment_level`, `estimated_days_until_full`)
null — nothing writes them for manufacturers today.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary |
| `restaurant_id` | `uuid` | Nullable — set only for restaurant-owned tanks |
| `manufacturer_id` | `uuid` | Nullable — set only for manufacturer-owned tanks |
| `name` | `text` | |
| `fill_percent` | `numeric` | Nullable |
| `current_volume_liters` | `numeric` | Nullable |
| `temperature_f` | `numeric` | Nullable |
| `is_active` | `bool` | Nullable |
| `last_updated` | `timestamptz` | Nullable — use this, not `updated_at` |
| `connectivity` | `device_connectivity` | Nullable |
| `sediment_level` | `sediment_level` | Nullable |
| `status_text` | `text` | Nullable |
| `estimated_days_until_full` | `int4` | Nullable |

---

## `pickups`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary |
| `restaurant_id` | `uuid` | |
| `collector_id` | `uuid` | Nullable |
| `manufacturer_id` | `uuid` | Nullable |
| `tank_id` | `uuid` | Nullable |
| `pickup_date` | `date` | Nullable |
| `pickup_time_start` | `time` | Nullable |
| `pickup_time_end` | `time` | Nullable |
| `status` | `pickup_status` | See lifecycle in README |
| `urgency` | `urgency_level` | Nullable |
| `estimated_volume_liters` | `numeric` | Nullable |
| `actual_volume_liters` | `numeric` | Nullable |
| `quality_grade` | `quality_grade` | Nullable |
| `pickup_type` | `pickup_type` | **Required** |
| `manual_request_id` | `uuid` | Nullable |
| `notes` | `text` | Nullable |
| `created_at` | `timestamptz` | Nullable |
| `updated_at` | `timestamptz` | Nullable |

---

## `manual_pickup_requests`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary |
| `restaurant_id` | `uuid` | |
| `tank_id` | `uuid` | Nullable |
| `urgency` | `urgency_level` | |
| `reason` | `text` | |
| `notes` | `text` | Nullable |
| `created_at` | `timestamptz` | Nullable |

---

## `quality_logs`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary |
| `restaurant_id` | `uuid` | |
| `pickup_id` | `uuid` | Nullable |
| `grade` | `quality_grade` | Nullable — use `grade`, not `oil_grade` |
| `impurity_pct` | `numeric` | Nullable |
| `analyzed_by` | `text` | Nullable |
| `notes` | `text` | Nullable |
| `created_at` | `timestamptz` | Nullable |

---

## `market_rates`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary |
| `grade` | `quality_grade` | |
| `rate_per_liter` | `numeric` | |
| `change_label` | `text` | Nullable |
| `change_positive` | `bool` | Nullable |
| `created_at` | `timestamptz` | Nullable |

---

## `restaurant_wallets`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary |
| `restaurant_id` | `uuid` | Unique |
| `balance` | `numeric` | Nullable — use `balance`, not `available_balance` |
| `updated_at` | `timestamptz` | Nullable |

---

## `earnings`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary |
| `restaurant_id` | `uuid` | |
| `pickup_id` | `uuid` | Nullable |
| `amount` | `numeric` | |
| `liters` | `numeric` | Nullable |
| `quality_grade` | `quality_grade` | Nullable — not `oil_grade` |
| `description` | `text` | Nullable |
| `created_at` | `timestamptz` | Nullable |

---

## `withdrawals`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary |
| `restaurant_id` | `uuid` | |
| `amount` | `numeric` | |
| `method` | `text` | Nullable |
| `status` | `text` | Nullable |
| `created_at` | `timestamptz` | Nullable |

---

## `alerts`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` | Filter by `owner_user_id` of logged-in user |
| `title` | `text` | |
| `message` | `text` | |
| `type` | `text` | Nullable |
| `category` | `alert_category` | Nullable |
| `is_read` | `bool` | Nullable |
| `created_at` | `timestamptz` | Nullable |

---

## `tank_readings`

`tank_id` can point at either a restaurant-owned or manufacturer-owned
`tanks` row — it's agnostic to owner type.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary |
| `tank_id` | `uuid` | |
| `fill_percent` | `numeric` | |
| `temperature_f` | `numeric` | Nullable |
| `recorded_at` | `timestamptz` | |

---

## `activity_logs`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary |
| `restaurant_id` | `uuid` | |
| `title` | `text` | |
| `subtitle` | `text` | Nullable |
| `badge` | `text` | Nullable |
| `badge_type` | `activity_badge_type` | Nullable |
| `created_at` | `timestamptz` | Nullable |

---

## `pickup_schedules`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary |
| `restaurant_id` | `uuid` | |
| `title` | `text` | |
| `subtitle` | `text` | Nullable |
| `frequency` | `schedule_frequency` | |
| `next_pickup_date` | `date` | |
| `is_active` | `bool` | |
| `created_at` | `timestamptz` | Nullable |

---

## `manufacturer_inventory`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary |
| `manufacturer_id` | `uuid` | Unique |
| `current_stock_liters` | `numeric` | |
| `stock_change_pct` | `numeric` | Nullable |
| `updated_at` | `timestamptz` | Nullable |

---

## `forecasts`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary |
| `manufacturer_id` | `uuid` | |
| `period_days` | `int4` | |
| `total_volume_liters` | `numeric` | |
| `grade_a_pct` | `numeric` | Nullable |
| `grade_b_pct` | `numeric` | Nullable |
| `grade_c_pct` | `numeric` | Nullable |
| `trend_label` | `text` | Nullable |
| `confidence_pct` | `numeric` | Nullable |
| `created_at` | `timestamptz` | |

---

## `ai_chat_messages`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` | |
| `is_user` | `bool` | |
| `message_text` | `text` | |
| `created_at` | `timestamptz` | Nullable |

---

## UI concept → column mapping

| UI label | Table.column |
|---|---|
| Tank fill % | `tanks.fill_percent` |
| Tank volume | `tanks.current_volume_liters` |
| Tank temperature | `tanks.temperature_f` |
| Last IoT ping | `tanks.last_updated` |
| Wallet balance | `restaurant_wallets.balance` |
| Oil grade (quality) | `quality_logs.grade` |
| Oil grade (earnings) | `earnings.quality_grade` |
| Impurity % | `quality_logs.impurity_pct` |
| Market price | `market_rates.rate_per_liter` |
| Pickup date | `pickups.pickup_date` |
| Pickup time window | `pickups.pickup_time_start` + `pickup_time_end` |
| Pickup volume | `pickups.estimated_volume_liters` |
| Driver name | `collectors.full_name` (via join) |
| Next recurring pickup | `pickup_schedules.next_pickup_date` |
| Chart readings | `tank_readings.fill_percent` @ `recorded_at` |
