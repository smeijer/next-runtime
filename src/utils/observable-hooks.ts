import { useEffect, useState } from 'react';
import { Observable } from 'rxjs';

/**
 * Returns the latest value from an observable.
 * @param observable The observable to subscribe to. This should be stable.
 * @param callback The callback to call when the value changes. This should be stable.
 */
export function useObservableCallback<Value>(
  observable: Observable<Value>,
  callback: (value: Value) => void,
): void {
  useEffect(() => {
    const subscription = observable.subscribe(callback);
    return () => subscription.unsubscribe();
  }, [observable, callback]);
}

/**
 * Returns the latest value from an observable.
 * @param observable The observable to subscribe to. This should be stable.
 * @param fallback The initial value
 */
export function useObservableValue<Value>(
  observable: Observable<Value>,
  fallback: Value,
): Value {
  const [value, setValue] = useState<Value>(fallback);
  useObservableCallback(observable, setValue);
  return value;
}
