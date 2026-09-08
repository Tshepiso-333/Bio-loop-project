import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = '@bioloop';

export const cacheKeys = {
  profile: (userId) => `${PREFIX}/profile/${userId}`,
  restaurant: (userId) => `${PREFIX}/restaurant/${userId}`,
  collector: (userId) => `${PREFIX}/collector/${userId}`,
  manufacturer: (userId) => `${PREFIX}/manufacturer/${userId}`,
};

export async function readCache(key) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return parsed?.data ?? null;
  } catch (err) {
    console.warn('Cache read failed:', err.message);
    return null;
  }
}

export async function writeCache(key, data) {
  try {
    await AsyncStorage.setItem(
      key,
      JSON.stringify({
        updatedAt: new Date().toISOString(),
        data,
      })
    );
  } catch (err) {
    console.warn('Cache write failed:', err.message);
  }
}

export async function clearCache(key) {
  try {
    await AsyncStorage.removeItem(key);
  } catch (err) {
    console.warn('Cache clear failed:', err.message);
  }
}

export async function clearUserCaches(userId) {
  if (!userId) return;

  await Promise.all([
    clearCache(cacheKeys.profile(userId)),
    clearCache(cacheKeys.restaurant(userId)),
    clearCache(cacheKeys.collector(userId)),
    clearCache(cacheKeys.manufacturer(userId)),
  ]);
}
