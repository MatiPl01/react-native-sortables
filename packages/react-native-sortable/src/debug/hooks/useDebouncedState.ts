import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useRef, useState } from 'react';

export default function useDebouncedState<S>(
  initialState: (() => S) | S,
  debounceTimeout: number = 100
): [S, Dispatch<SetStateAction<S>>] {
  const [state, setState] = useState(initialState);

  const prevStateRef = useRef<S>(state);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedSetState = useCallback<Dispatch<SetStateAction<S>>>(
    prop => {
      const newState =
        typeof prop === 'function'
          ? (prop as (prevState: S) => S)(prevStateRef.current)
          : prop;
      // Store the result in the ref to ensure that the latest state is always used
      // even if the debounce timeout is still running
      prevStateRef.current = newState;

      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = setTimeout(() => {
        setState(newState);
      }, debounceTimeout);
    },
    [debounceTimeout]
  );

  return [state, debouncedSetState];
}
