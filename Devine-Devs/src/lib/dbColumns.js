/**
 * Canonical Supabase column names for BioLoop.
 * Keep service SELECT lists and view-model mappers aligned with this file.
 */

export const profiles = {
  table: 'profiles',
  select:
    'id, email, role, full_name, phone, profile_image_url, city, province, bio, status, created_at, updated_at',
};

export const restaurants = {
  table: 'restaurants',
  select:
    `
    id,
    owner_user_id,
    name,
    owner_name,
    business_type,
    address,
    district,
    cuisine,
    latitude,
    longitude,
    phone,
    email,
    image_url,
    website_url,
    google_business_url,
    operating_hours,
    estimated_monthly_oil_liters,
    pickup_instructions,
    preferred_pickup_days,
    profile_image_url,
    cover_image_url,
    is_verified,
    verified_at,
    status,
    created_at,
    updated_at
    `.replace(/\s+/g, ' ').trim(),
};

export const collectors = {
  table: 'collectors',
  select:
    `
    id,
    owner_user_id,
    full_name,
    employee_code,
    district,
    route_name,
    vehicle_info,
    profile_image_url,
    vehicle_type,
    vehicle_make,
    vehicle_model,
    vehicle_registration,
    drivers_license_number,
    years_experience,
    languages,
    bio,
    rating,
    reviews_count,
    total_liters,
    total_collections,
    co2_saved_kg,
    is_verified,
    verified_at,
    status,
    is_on_duty,
    current_latitude,
    current_longitude,
    location_updated_at,
    created_at,
    updated_at
    `.replace(/\s+/g, ' ').trim(),
};

export const manufacturers = {
  table: 'manufacturers',
  select:
    `
    id,
    owner_user_id,
    name,
    address,
    contact_phone,
    contact_email,
    position,
    contact_person,
    company_registration_number,
    website_url,
    company_description,
    accepted_grades,
    years_in_business,
    profile_image_url,
    cover_image_url,
    is_verified,
    verified_at,
    status,
    created_at,
    updated_at
    `.replace(/\s+/g, ' ').trim(),
};

export const tanks = {
  columns: {
    fillPercent: 'fill_percent',
    volumeLiters: 'current_volume_liters',
    temperatureF: 'temperature_f',
    lastUpdated: 'last_updated',
    connectivity: 'connectivity',
    sedimentLevel: 'sediment_level',
    isActive: 'is_active',
    statusText: 'status_text',
    estimatedDaysUntilFull: 'estimated_days_until_full',

    capacityLiters: 'capacity_liters',
    installationDate: 'installation_date',
    serialNumber: 'serial_number',
  },
};

export const pickups = {
  table: 'pickups',
  collectorJoin:
    '*, collectors(full_name, rating, total_collections, reviews_count, profile_image_url)',

  columns: {
    pickupDate: 'pickup_date',
    timeStart: 'pickup_time_start',
    timeEnd: 'pickup_time_end',
    estimatedVolumeLiters: 'estimated_volume_liters',
    actualVolumeLiters: 'actual_volume_liters',
    qualityGrade: 'quality_grade',
    pickupType: 'pickup_type',

    collectorNotes: 'collector_notes',
    restaurantNotes: 'restaurant_notes',
    completedAt: 'completed_at',
  },
};

export const qualityLogs = {
  columns: {
    grade: 'grade',
    impurityPct: 'impurity_pct',
    analyzedBy: 'analyzed_by',
  },
};

export const restaurantWallets = {
  columns: {
    balance: 'balance',
  },
};

export const earnings = {
  columns: {
    amount: 'amount',
    liters: 'liters',
    qualityGrade: 'quality_grade',
    description: 'description',
  },
};

export const marketRates = {
  columns: {
    grade: 'grade',
    ratePerLiter: 'rate_per_liter',
    changeLabel: 'change_label',
    changePositive: 'change_positive',
  },
};

export const pickupSchedules = {
  columns: {
    nextPickupDate: 'next_pickup_date',
    frequency: 'frequency',
    title: 'title',
    subtitle: 'subtitle',
  },
};

export const tankReadings = {
  columns: {
    fillPercent: 'fill_percent',
    temperatureF: 'temperature_f',
    recordedAt: 'recorded_at',
  },
};

export const activityLogs = {
  columns: {
    title: 'title',
    subtitle: 'subtitle',
    badge: 'badge',
    badgeType: 'badge_type',
  },
};

export const alerts = {
  columns: {
    title: 'title',
    message: 'message',
    type: 'type',
    category: 'category',
  },
};