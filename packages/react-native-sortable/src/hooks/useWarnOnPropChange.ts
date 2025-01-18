import { useEffect, useRef } from 'react';

import { WARNINGS } from '../constants';

export default function useWarnOnPropChange(prop: string, value: unknown) {
  const previousValueRef = useRef(value);

  useEffect(() => {
    if (previousValueRef.current !== value) {
      console.warn(WARNINGS.propChange(prop));
      previousValueRef.current = value;
    }
  }, [prop, value]);
}
