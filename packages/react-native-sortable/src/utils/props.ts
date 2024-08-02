/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable import/no-unused-modules */

import { DEFAULT_SHARED_PROPS } from '../constants/props';
import type { SharedProps } from '../types';

export const getPropsWithDefaults = <P extends SharedProps>(
  props: P
): {
  sharedProps: Required<SharedProps>;
  rest: Omit<P, keyof SharedProps>;
} => {
  const propsWithDefaults = { ...DEFAULT_SHARED_PROPS, ...props };

  const sharedProps: Record<string, any> = {};
  const rest: Record<string, any> = {};

  for (const key in propsWithDefaults) {
    const k = key as keyof P;
    if (Object.prototype.hasOwnProperty.call(DEFAULT_SHARED_PROPS, k)) {
      sharedProps[key] = propsWithDefaults[k];
    } else {
      rest[key] = propsWithDefaults[k];
    }
  }

  return {
    rest: rest as Omit<P, keyof SharedProps>,
    sharedProps: sharedProps as Required<SharedProps>
  };
};
