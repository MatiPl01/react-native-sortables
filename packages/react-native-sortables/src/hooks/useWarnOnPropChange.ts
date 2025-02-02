import { useEffect, useRef } from 'react';

import { WARNINGS } from '../constants';
import { logger } from '../utils';

export default function useWarnOnPropChange(prop: string, value: unknown) {
  const previousValueRef = useRef(value);

  useEffect(() => {
    if (previousValueRef.current !== value) {
      logger.warn(WARNINGS.propChange(prop));
      previousValueRef.current = value;
    }
  }, [prop, value]);
}
