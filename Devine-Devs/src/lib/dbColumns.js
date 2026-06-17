/**
 * Canonical Supabase column names for BioLoop.
 * Keep service SELECT lists and view-model mappers aligned with this file.
 */

export const profiles = {
  table: 'profiles',
  select:
    'id, email, role, full_name, phone, status, created_at, updated_at',
};

export const restaurants = {
  table: 'restaurants',
  select:
    'id, owner_user_id, name, address, district, cuisine, latitude, longitude, phone, email, image_url, status, created_at, updated_at',
};

export const tanks = {
  table: 'tanks',
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
  },
};

export const pickups = {
  table: 'pickups',
  collectorJoin:
    '*, collectors(full_name, rating, total_collections, reviews_count)',
  columns: {
    pickupDate: 'pickup_date',
    timeStart: 'pickup_time_start',
    timeEnd: 'pickup_time_end',
    estimatedVolumeLiters: 'estimated_volume_liters',
    actualVolumeLiters: 'actual_volume_liters',
    qualityGrade: 'quality_grade',
    pickupType: 'pickup_type',
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
