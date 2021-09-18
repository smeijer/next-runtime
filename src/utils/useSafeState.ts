import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Sets state while avoiding the "set state while unmounted" warning,
 * can eventually be removed in react 18 (hopefully!)
 */
export function useSafeState<T>(initial: T) {
  const [state, setState] = useState(initial);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const setStateIfMounted = useCallback((value: T) => {
    if (mounted.current) setState(value);
  }, []);

  return [state, setStateIfMounted] as const;
}
