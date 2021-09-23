import {
  ForwardedRef,
  MutableRefObject,
  RefObject,
  useEffect,
  useRef,
} from 'react';

export function useRefs<T extends unknown>(
  ...refs: Array<
    | MutableRefObject<T | null>
    | ((ref: T | null) => RefObject<T>)
    | ForwardedRef<T>
  >
): RefObject<T> {
  const targetRef = useRef<T>(null);

  useEffect(() => {
    [...refs].forEach((ref) => {
      if (!ref) return;
      if (typeof ref === 'function') return ref(targetRef.current);
      return (ref.current = targetRef.current);
    });
  }, [refs]);

  return targetRef;
}
