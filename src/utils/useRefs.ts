import { useEffect, useRef } from 'react';

export function useRefs<T>(...refs) {
  const innerRef = useRef<T>(null);
  const targetRef = useRef<T>(null);

  useEffect(() => {
    [...refs, innerRef].forEach((ref) => {
      if (!ref) return;
      if (typeof ref === 'function') return ref(targetRef.current);
      return (ref.current = targetRef.current);
    });
  }, [refs, innerRef]);

  return targetRef;
}
