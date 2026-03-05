import { useEffect, useRef, useState } from 'react';

const readValue = <T,>(key: string, initialValue: T) => {
  const raw = localStorage.getItem(key);
  if (!raw) return initialValue;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return initialValue;
  }
};

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
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
};
