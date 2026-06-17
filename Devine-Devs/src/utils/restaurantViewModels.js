/**
 * Maps Supabase rows to UI view models.
 * Column names match docs/SCHEMA.md — do not guess alternate names here.
 */

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

export const formatCurrency = (amount) => {
  const value = toNumber(amount, NaN);
  if (Number.isNaN(value)) return 'R0.00';
  return `R${value.toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatShortDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
};

export const formatLongDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-ZA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatDateTimeMultiline = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const datePart = date.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
  const timePart = date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
  return `${datePart},\n${timePart}`;
};

export const formatRelativeTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

export const getInitials = (name, fallback = 'RS') => {
  if (!name || typeof name !== 'string') return fallback;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const formatGradeLabel = (grade) => {
  if (!grade) return '—';
  const value = String(grade);
  return value.startsWith('Grade') ? value : `Grade ${value}`;
};

const formatTimeValue = (value) => {
  if (!value) return null;
  return String(value).slice(0, 5);
};

export const formatPickupTimeWindow = (pickup) => {
  const start = formatTimeValue(pickup?.pickup_time_start);
  const end = formatTimeValue(pickup?.pickup_time_end);
  if (start && end) return `${start} - ${end}`;
  if (start) return start;
  return '—';
};

export const getPickupReferenceDate = (pickup) =>
  pickup?.pickup_date ?? pickup?.created_at ?? null;

const ACTIVE_PICKUP_STATUSES = ['scheduled', 'in_transit', 'arrival', 'in_progress'];
const COMPLETED_PICKUP_STATUSES = ['completed'];

export const getActivePickup = (pickups = []) =>
  pickups.find((pickup) => ACTIVE_PICKUP_STATUSES.includes(pickup.status)) ?? null;

export const getUpcomingPickup = (pickups = []) =>
  pickups.find(
    (pickup) =>
      pickup.status === 'scheduled' ||
      pickup.status === 'pending' ||
      (pickup.pickup_date && !COMPLETED_PICKUP_STATUSES.includes(pickup.status))
  ) ?? null;

export const getCompletedPickups = (pickups = []) =>
  pickups.filter((pickup) => COMPLETED_PICKUP_STATUSES.includes(pickup.status));

const STATUS_STEP_INDEX = {
  scheduled: 0,
  in_transit: 1,
  arrival: 2,
  in_progress: 2,
  completed: 2,
};

export const mapTankCardData = (tank) => {
  if (!tank) return null;

  const fillPercent = toNumber(tank.fill_percent, 0);
  const estimatedDays = toNumber(
    tank.estimated_days_until_full,
    fillPercent >= 80 ? 2 : fillPercent >= 60 ? 5 : 10
  );

  return {
    label: tank.name ?? 'Main Storage Tank',
    fillPercent,
    statusText:
      tank.status_text ??
      (fillPercent >= 80 ? 'Full' : fillPercent >= 50 ? 'Moderate' : 'Normal'),
    statusNote: 'Capacity monitoring active. Estimated full in',
    estimatedDays,
    currentVolume: toNumber(tank.current_volume_liters, 0),
    temperature: toNumber(tank.temperature_f, 0),
  };
};

export const mapPickupAlert = (alerts = [], tank) => {
  const alert =
    alerts.find((item) =>
      ['pickup', 'tank', 'capacity'].includes(String(item.category ?? item.type ?? '').toLowerCase())
    ) ?? alerts[0];

  if (alert) {
    return {
      visible: true,
      title: alert.title ?? 'Pickup Ready',
      message: alert.message ?? 'Action recommended.',
    };
  }

  if (toNumber(tank?.fill_percent, 0) >= 80) {
    return {
      visible: true,
      title: 'Pickup Ready',
      message:
        'Capacity threshold approaching 80%. System recommends scheduling pickup soon.',
    };
  }

  return { visible: false, title: '', message: '' };
};

export const mapHomeStats = ({ qualityLogs = [], earnings = [], pickups = [] }) => {
  const latestQuality = qualityLogs[0];
  const latestEarning = earnings[0];
  const lastCompletedPickup =
    pickups.find((pickup) => pickup.status === 'completed') ?? pickups[0];

  return {
    oilGrade: formatGradeLabel(latestQuality?.grade ?? latestEarning?.quality_grade),
    estimatedEarnings: latestEarning ? formatCurrency(latestEarning.amount) : '—',
    lastPickupDate: formatShortDate(getPickupReferenceDate(lastCompletedPickup)),
  };
};

const ACTIVITY_ICON_CYCLE = [
  { name: 'water-outline', color: '#10B981', bg: '#D1FAE5' },
  { name: 'checkmark-circle-outline', color: '#2563EB', bg: '#DBEAFE' },
  { name: 'receipt-outline', color: '#D97706', bg: '#FEF3C7' },
];

export const mapActivityItems = (activityLogs = []) => {
  if (activityLogs.length === 0) return { items: [], icons: ACTIVITY_ICON_CYCLE };

  const items = activityLogs.slice(0, 3).map((log) => ({
    id: String(log.id),
    title: log.title,
    subtitle: log.subtitle ?? formatRelativeTime(log.created_at),
    badge: log.badge ?? '',
    badgeType: log.badge_type ?? 'label',
  }));

  return { items, icons: ACTIVITY_ICON_CYCLE };
};

export const mapMonitoringTankInfo = (tank) => {
  if (!tank) {
    return { name: 'Tank Monitoring', isActive: false, lastPing: '—', currentCapacity: 0 };
  }

  return {
    name: tank.name ?? 'Tank 01 Monitoring',
    isActive: tank.is_active === true,
    lastPing: formatRelativeTime(tank.last_updated),
    currentCapacity: toNumber(tank.fill_percent, 0),
  };
};

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export const mapOilTrendData = (tankReadings = []) => {
  if (tankReadings.length === 0) return [];

  const recent = [...tankReadings]
    .sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at))
    .slice(0, 7)
    .reverse();

  return recent.map((reading) => {
    const date = new Date(reading.recorded_at);
    const day = Number.isNaN(date.getTime()) ? '—' : DAY_LABELS[date.getDay()];
    return {
      day,
      value: toNumber(reading.fill_percent, 0),
    };
  });
};

export const mapPredictiveAlert = (tank, alerts = []) => {
  const alert = alerts.find((item) =>
    String(item.category ?? item.type ?? '')
      .toLowerCase()
      .includes('predict')
  );

  if (alert) {
    return {
      visible: true,
      hoursUntilFull: 48,
      message: alert.message ?? 'Schedule pickup soon.',
    };
  }

  const fillPercent = toNumber(tank?.fill_percent, 0);
  if (fillPercent >= 75) {
    const days = toNumber(tank?.estimated_days_until_full, 2);
    return {
      visible: true,
      hoursUntilFull: days * 24,
      message:
        'Estimated time until 95% capacity based on current disposal rates. Schedule pickup soon.',
    };
  }

  return { visible: false, hoursUntilFull: 0, message: '' };
};

export const mapQualityLogRows = (qualityLogs = []) =>
  qualityLogs.slice(0, 6).map((log) => ({
    id: String(log.id),
    timestamp: formatDateTimeMultiline(log.created_at),
    analyzedBy: log.analyzed_by ?? 'Sensor\nAI v2.4',
    oilLevel: `${toNumber(log.impurity_pct, 0)}%`,
  }));

export const mapDeviceStats = (tank, pickups = []) => {
  const lastCompletedPickup = pickups.find((pickup) => pickup.status === 'completed');
  const referenceDate = getPickupReferenceDate(lastCompletedPickup);
  const lastPickupDays = referenceDate
    ? Math.max(0, Math.floor((Date.now() - new Date(referenceDate).getTime()) / 86400000))
    : null;

  return [
    {
      label: 'Temperature',
      value: `${toNumber(tank?.temperature_f, 0)}°F`,
      valueColor: '#EA580C',
    },
    {
      label: 'Connectivity',
      value: tank?.connectivity ? String(tank.connectivity) : '—',
      valueColor: '#10b981',
    },
    {
      label: 'Last Pickup',
      value: lastPickupDays === null ? '—' : `${lastPickupDays} Days`,
      valueColor: null,
    },
    {
      label: 'Sediment',
      value: tank?.sediment_level ? String(tank.sediment_level) : '—',
      valueColor: null,
    },
  ];
};

export const mapActivePickupCard = (pickup) => {
  if (!pickup) return { visible: false };

  const statusTitles = {
    scheduled: 'Pickup scheduled',
    in_transit: 'Driver en route',
    arrival: 'Driver arrived',
    in_progress: 'Collection in progress',
  };

  return {
    visible: true,
    statusLabel: 'Active Pickup',
    statusTitle: statusTitles[pickup.status] ?? 'Pickup in progress',
    currentStep: STATUS_STEP_INDEX[pickup.status] ?? 0,
  };
};

export const mapUpcomingPickupCard = (pickup) => {
  if (!pickup) return null;

  const driverName = pickup.collectors?.full_name ?? 'Assigned soon';
  const estimatedLiters = toNumber(pickup.estimated_volume_liters, 0);

  return {
    scheduledType: pickup.pickup_type ?? 'Scheduled',
    status: pickup.status === 'scheduled' ? 'Confirmed' : 'Scheduled',
    date: formatLongDate(getPickupReferenceDate(pickup)),
    etaWindow: formatPickupTimeWindow(pickup),
    driverName,
    driverInitials: getInitials(driverName, 'D'),
    estimatedVolume: estimatedLiters ? `${estimatedLiters} Liters` : '—',
  };
};

export const mapUpcomingCycle = (schedule) => {
  if (!schedule) return null;

  const date = schedule.next_pickup_date ? new Date(schedule.next_pickup_date) : null;

  return {
    month: date
      ? date.toLocaleDateString('en-ZA', { month: 'short' }).toUpperCase()
      : '—',
    day: date ? String(date.getDate()).padStart(2, '0') : '—',
    title: schedule.title ?? 'Routine Pickup',
    subtitle: schedule.subtitle ?? schedule.frequency ?? 'Recurring schedule',
  };
};

export const mapBalance = (wallet) => ({
  label: 'Available Balance',
  amount: formatCurrency(wallet?.balance ?? 0),
});

const GRADE_COLORS = {
  A: '#10b981',
  B: '#F59E0B',
  C: '#64748B',
};

export const mapMarketRates = (marketRates = []) => ({
  updatedLabel: marketRates[0]
    ? `Updated ${formatRelativeTime(marketRates[0].created_at)}`
    : 'Updated recently',
  grades: marketRates.slice(0, 3).map((rate, index) => {
    const grade = rate.grade ?? String.fromCharCode(65 + index);
    return {
      id: String(rate.id ?? grade),
      grade: formatGradeLabel(grade),
      rate: formatCurrency(rate.rate_per_liter).replace('.00', ''),
      unit: '/L',
      change: rate.change_label ?? 'Current market rate',
      changePositive:
        rate.change_positive === true ? true : rate.change_positive === false ? false : null,
      dotColor: GRADE_COLORS[String(grade).charAt(0)] ?? '#10b981',
    };
  }),
});

export const mapAvgQuality = (qualityLogs = []) => {
  const latest = qualityLogs[0];

  return {
    badge: latest?.grade ? formatGradeLabel(latest.grade) : 'High Grade',
    description:
      latest?.notes ?? 'Your oil quality is tracked from recent collection checks.',
  };
};

export const mapRecentEarnings = (earnings = []) =>
  earnings.slice(0, 5).map((earning) => {
    const liters = toNumber(earning.liters, 0);
    const detail = `${liters ? `${liters} Liters • ` : ''}${formatGradeLabel(earning.quality_grade)}`;

    return {
      id: String(earning.id),
      date: formatShortDate(earning.created_at),
      title: earning.description ?? 'Collection',
      detail,
      amount: `+${formatCurrency(earning.amount)}`,
      amountDetail: detail,
    };
  });

export const mapWithdrawalHistory = (withdrawals = []) =>
  withdrawals.slice(0, 10).map((withdrawal) => ({
    id: String(withdrawal.id),
    date: formatLongDate(withdrawal.created_at),
    method: withdrawal.method ?? 'Bank Transfer',
    methodIcon: 'business-outline',
    amount: `-${formatCurrency(withdrawal.amount)}`,
  }));

export const mapScheduleStatus = ({ tank, qualityLogs = [] }) => {
  const fillPercent = toNumber(tank?.fill_percent, 0);
  const grade = qualityLogs[0]?.grade ?? 'A';

  return {
    title: 'Scheduled Pickup',
    subtitle: `Tank at ${fillPercent}% • ${formatGradeLabel(grade)} oil detected`,
  };
};

export const mapSchedulePickupDate = (pickup) =>
  formatLongDate(getPickupReferenceDate(pickup));

export const mapScheduleDriver = (pickup) => {
  const collector = pickup?.collectors;

  return {
    name: collector?.full_name ?? 'To be assigned',
    initials: getInitials(collector?.full_name, 'D'),
    rating: collector?.rating ?? '—',
    collections: collector?.total_collections ?? '—',
  };
};
