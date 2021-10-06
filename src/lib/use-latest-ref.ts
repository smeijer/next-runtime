import { RefObject, useEffect, useRef } from 'react';

/**
 * Helpful when we want to use a value in an effect or useCallback,
 * but don't want to react to changes
 */
export function useLatestRef<T>(value: T): RefObject<T> {
  const ref = useRef<T>(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}
