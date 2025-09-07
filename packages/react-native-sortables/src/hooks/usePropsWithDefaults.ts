import { useMemo } from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { DEFAULT_SHARED_PROPS } from '../constants';
import type { AnyRecord, RequiredBy } from '../helperTypes';
import type { SharedProps } from '../types';

export type PropsWithDefaults<P extends AnyRecord, D extends AnyRecord> = Omit<
  P,
  keyof D
> &
  Required<SharedProps> &
  RequiredBy<P, keyof D & keyof P>;

const isDefaultValueGetter = <T>(
  value: T | { get: () => T }
): value is { get: () => T } => {
  return typeof value === 'object' && value !== null && 'get' in value;
};

export default function usePropsWithDefaults<
  P extends SharedProps,
  D extends AnyRecord
>(props: P, componentDefaultProps: D): PropsWithDefaults<P, D> {
  const keys = new Set([
    ...Object.keys(componentDefaultProps),
    ...Object.keys(DEFAULT_SHARED_PROPS),
    ...Object.keys(props)
  ]);

  const propsWithDefaults = {} as P;

  // Merge user-defined props with defaults
  for (const key of keys) {
    const k = key as keyof P;
    if (props[k] !== undefined) {
      propsWithDefaults[k] = props[k];
    } else {
      const defaultProp =
        componentDefaultProps[key as keyof typeof componentDefaultProps] ??
        DEFAULT_SHARED_PROPS[key as keyof typeof DEFAULT_SHARED_PROPS];

      propsWithDefaults[k] = (
        isDefaultValueGetter(defaultProp) ? defaultProp.get() : defaultProp
      ) as P[keyof P];
    }
  }

  // merge drop indicator style from props and defaults
  propsWithDefaults.dropIndicatorStyle = useMemo(() => {
    const result = { ...DEFAULT_SHARED_PROPS.dropIndicatorStyle };
    const propsStyle = StyleSheet.flatten(props.dropIndicatorStyle ?? {});

    for (const key in propsStyle) {
      const k = key as keyof ViewStyle;
      if (propsStyle[k] !== undefined) {
        // @ts-expect-error This is fine
        result[k] = propsStyle[k];
      }
    }

    return result;
  }, [props.dropIndicatorStyle]);

  return propsWithDefaults as PropsWithDefaults<P, D>;
}
