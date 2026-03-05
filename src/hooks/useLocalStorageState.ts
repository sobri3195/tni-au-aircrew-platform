import { useEffect, useRef, useState } from 'react';
import { readJsonStorage, writeJsonStorage } from '../utils/storage';

const readValue = <T,>(key: string, initialValue: T) => readJsonStorage(key, initialValue);

export const useLocalStorageState = <T,>(key: string, initialValue: T) => {
  const [value, setValue] = useState<T>(() => readValue(key, initialValue));
  const previousKey = useRef(key);

  useEffect(() => {
    if (previousKey.current !== key) {
      previousKey.current = key;
      setValue(readValue(key, initialValue));
    }
  }, [initialValue, key]);

  useEffect(() => {
    writeJsonStorage(key, value);
  }, [key, value]);

  useEffect(() => {
    const syncFromStorage = (event: StorageEvent) => {
      if (event.key !== key) return;
      setValue(readValue(key, initialValue));
    };

    window.addEventListener('storage', syncFromStorage);
    return () => window.removeEventListener('storage', syncFromStorage);
  }, [initialValue, key]);

  return [value, setValue] as const;
};
