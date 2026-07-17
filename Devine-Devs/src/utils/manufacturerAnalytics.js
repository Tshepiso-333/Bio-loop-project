// Analytics helpers for deriving Manufacturer UI view-models from raw `pickups` rows.
// Column names match docs/SCHEMA.md.

export const getPickupVolume = (pickup) =>
  pickup?.estimated_volume_liters ?? pickup?.actual_volume_liters ?? 0;

// Buckets pickups into the last `monthsCount` calendar months (oldest -> newest),
// summing volume per quality grade. Used by QualityScreen's "Last 4 months" trend chart.
export function groupPickupsByMonth(pickups = [], monthsCount = 4) {
  const now = new Date();
  const buckets = [];
  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      gradeA: 0,
      gradeB: 0,
      gradeC: 0,
    });
  }
  const byKey = Object.fromEntries(buckets.map((b) => [b.key, b]));

  (pickups || []).forEach((p) => {
    if (!p.pickup_date) return;
    const d = new Date(p.pickup_date);
    if (Number.isNaN(d.getTime())) return;
    const bucket = byKey[`${d.getFullYear()}-${d.getMonth()}`];
    if (!bucket) return;
    const grade = (p.quality_grade || '').toUpperCase();
    const volume = getPickupVolume(p);
    if (grade === 'A') bucket.gradeA += volume;
    else if (grade === 'B') bucket.gradeB += volume;
    else if (grade === 'C') bucket.gradeC += volume;
  });

  return buckets.map(({ key, ...rest }) => rest);
}

// Buckets pickups into the last `daysCount` calendar days (oldest -> newest),
// summing total volume and the % of that day's volume that was Grade A.
// Used by ForecastsScreen's historical/daily chart.
export function groupPickupsByDay(pickups = [], daysCount = 7) {
  const now = new Date();
  const buckets = [];
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    buckets.push({
      key: d.toDateString(),
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      volume: 0,
      gradeAVolume: 0,
    });
  }
  const byKey = Object.fromEntries(buckets.map((b) => [b.key, b]));

  (pickups || []).forEach((p) => {
    if (!p.pickup_date) return;
    const d = new Date(p.pickup_date);
    if (Number.isNaN(d.getTime())) return;
    const bucket = byKey[d.toDateString()];
    if (!bucket) return;
    const volume = getPickupVolume(p);
    bucket.volume += volume;
    if ((p.quality_grade || '').toUpperCase() === 'A') bucket.gradeAVolume += volume;
  });

  return buckets.map(({ key, gradeAVolume, volume, ...rest }) => ({
    ...rest,
    volume,
    gradeA: volume > 0 ? Math.round((gradeAVolume / volume) * 100) : 0,
  }));
}

// Groups pickups by restaurant_id and computes per-supplier stats.
// Used by SuppliersScreen (one card per restaurant) and QualityScreen (top-supplier copy).
export function computeSupplierStats(pickups = []) {
  const byRestaurant = new Map();

  (pickups || []).forEach((p) => {
    const id = p.restaurant_id ?? p.restaurants?.name ?? 'unknown';
    if (!byRestaurant.has(id)) {
      byRestaurant.set(id, {
        id,
        name: p.restaurants?.name ?? 'Unknown',
        cuisine: p.restaurants?.cuisine ?? '—',
        image: p.restaurants?.image_url ?? null,
        location: p.restaurants?.address ?? '—',
        contact: p.restaurants?.phone ?? '—',
        email: p.restaurants?.email ?? '—',
        joinDate: p.restaurants?.created_at
          ? new Date(p.restaurants.created_at).toLocaleDateString()
          : '—',
        list: [],
      });
    }
    byRestaurant.get(id).list.push(p);
  });

  return Array.from(byRestaurant.values()).map((s) => {
    const { list, ...meta } = s;
    const totalCount = list.length;
    const completedCount = list.filter((p) => p.status === 'completed').length;
    const volume = list.reduce((sum, p) => sum + getPickupVolume(p), 0);
    const sorted = [...list].sort(
      (a, b) => new Date(b.pickup_date ?? 0) - new Date(a.pickup_date ?? 0)
    );
    const latest = sorted[0];

    return {
      ...meta,
      volume,
      quality: latest?.quality_grade ?? '—',
      deliveries: completedCount,
      reliability: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      lastDelivery: latest?.pickup_date
        ? new Date(latest.pickup_date).toLocaleDateString()
        : '—',
      qualityHistory: sorted
        .filter((p) => p.quality_grade)
        .slice(0, 10)
        .map((p) => ({ date: p.pickup_date, grade: p.quality_grade }))
        .reverse(),
      volumeHistory: groupPickupsByMonth(list, 6).map((m) => ({
        month: m.month,
        volume: m.gradeA + m.gradeB + m.gradeC,
      })),
    };
  });
}
