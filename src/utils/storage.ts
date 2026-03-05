export const isStorageAvailable = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const readJsonStorage = <T,>(key: string, fallback: T): T => {
  if (!isStorageAvailable()) return fallback;

  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    window.localStorage.removeItem(key);
    return fallback;
  }
};

export const writeJsonStorage = <T,>(key: string, value: T) => {
  if (!isStorageAvailable()) return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore write failure (e.g. quota exceeded / private mode restrictions)
  }
};
