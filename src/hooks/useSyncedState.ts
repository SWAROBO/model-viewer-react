import { useState, useEffect, useRef } from 'react';

/**
 * A custom hook that manages state synced with a prop, but can also be updated independently.
 * It avoids re-rendering if the prop reference changes but its deep value is the same.
 *
 * @param propValue The value from the component's props.
 * @returns A stateful value and a function to update it.
 */
export function useSyncedState<T>(propValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState(propValue);
  const previousPropValueRef = useRef(propValue);

  useEffect(() => {
    // Deep compare the current prop value with the previous prop value.
    // Only update the internal state if the prop value has actually changed.
    if (JSON.stringify(previousPropValueRef.current) !== JSON.stringify(propValue)) {
      setState(propValue);
      previousPropValueRef.current = propValue;
    }
  }, [propValue]);

  return [state, setState];
}
