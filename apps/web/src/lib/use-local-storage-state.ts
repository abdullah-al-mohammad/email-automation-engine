import { useCallback, useRef, useState, type Dispatch, type SetStateAction } from 'react';

function readStored<T>(key: string, fallback: T): T {
  try {
    const stored = window.localStorage.getItem(key);
    if (stored !== null) return JSON.parse(stored) as T;
  } catch {
    // ignore malformed or unreadable storage
  }
  return fallback;
}

/**
 * State that is persisted to localStorage and restored on mount.
 * Re-loads automatically when the key changes (e.g. tenant switch).
 */
export function useLocalStorageState<T>(
  key: string,
  initialValue: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValueState] = useState<T>(() => readStored(key, initialValue));

  const keyRef = useRef(key);
  if (keyRef.current !== key) {
    keyRef.current = key;
    setValueState(readStored(key, initialValue));
  }

  const setValue = useCallback(
    (action: SetStateAction<T>) => {
      setValueState((prev) => {
        const next = typeof action === 'function' ? (action as (prev: T) => T)(prev) : action;
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // ignore quota / privacy errors
        }
        return next;
      });
    },
    [key],
  );

  return [value, setValue];
}
