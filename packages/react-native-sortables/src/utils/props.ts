import type { ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';

import { DEFAULT_SHARED_PROPS, STYLE_PROPS } from '../constants/props';
import type { AnyRecord, RequiredBy } from '../helperTypes';
import type { SharedProps, SharedPropsInternal } from '../types';

const hasStyleProp = <K extends string, P extends AnyRecord>(
  styleKey: K,
  props: P
): props is P & { [key in K]: ViewStyle } => {
  return styleKey in props;
};

type PropsWithDefaults<P extends AnyRecord, D extends AnyRecord> = {
  sharedProps: Required<SharedPropsInternal>;
  rest: Omit<
    Omit<P, keyof D> & RequiredBy<P, keyof D & keyof P>,
    keyof SharedPropsInternal
  >;
};

const isDefaultValueGetter = <T>(
  value: T | { get: () => T }
): value is { get: () => T } => {
  return typeof value === 'object' && value !== null && 'get' in value;
};

export const getPropsWithDefaults = <
  P extends SharedProps,
  D extends AnyRecord
>(
  props: P,
  componentDefaultProps: D
): PropsWithDefaults<P, D> => {
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

  // merge styles from props and defaults
  for (const styleKey of STYLE_PROPS) {
    if (!hasStyleProp(styleKey, propsWithDefaults)) {
      continue;
    }

    const style: ViewStyle = {};

    Object.assign(style, DEFAULT_SHARED_PROPS[styleKey]);
    Object.assign(style, componentDefaultProps[styleKey]);

    const propsStyle = hasStyleProp(styleKey, props)
      ? StyleSheet.flatten(props[styleKey])
      : {};

    for (const key in propsStyle) {
      const k = key as keyof ViewStyle;
      if (propsStyle[k] !== undefined) {
        // @ts-expect-error This is fine
        style[k] = propsStyle[k];
      }
    }

    propsWithDefaults[styleKey] = style;
  }

  // Split props into shared and rest
  const sharedProps: AnyRecord = {};
  const rest: AnyRecord = {};

  for (const key in propsWithDefaults) {
    const k = key as keyof P;
    if (k in DEFAULT_SHARED_PROPS) {
      sharedProps[key] = propsWithDefaults[k];
    } else {
      rest[key] = propsWithDefaults[k];
    }
  }

  return { rest, sharedProps } as PropsWithDefaults<P, D>;
};
