/* eslint-disable @typescript-eslint/no-explicit-any */

import { StyleSheet, type ViewStyle } from 'react-native';

import { DEFAULT_SHARED_PROPS, STYLE_PROPS } from '../constants/props';
import type { SharedProps } from '../types';

const hasStyleProp = <K extends string, P extends Record<string, any>>(
  styleKey: K,
  props: P
): props is { [key in K]: ViewStyle } & P => {
  return styleKey in props;
};

export const getPropsWithDefaults = <
  P extends Record<string, any>,
  D extends Record<string, any>
>(
  props: P,
  componentDefaultProps: D
): {
  sharedProps: Required<{ [K in keyof SharedProps]: P[K] }>;
  rest: Omit<D & Omit<P, keyof D>, keyof SharedProps>;
} => {
  const propsWithDefaults = {
    ...DEFAULT_SHARED_PROPS,
    ...componentDefaultProps,
    ...props
  };

  // merge styles from props and defaults
  for (const styleKey of STYLE_PROPS) {
    if (hasStyleProp(styleKey, propsWithDefaults)) {
      const style = StyleSheet.flatten(
        [
          hasStyleProp(styleKey, DEFAULT_SHARED_PROPS) &&
            DEFAULT_SHARED_PROPS[styleKey],
          hasStyleProp(styleKey, componentDefaultProps) &&
            componentDefaultProps[styleKey],
          hasStyleProp(styleKey, props) && props[styleKey]
        ].filter(Boolean)
      );

      propsWithDefaults[styleKey] = style;
    }
  }

  const sharedProps: Record<string, any> = {};
  const rest: Record<string, any> = {};

  for (const key in propsWithDefaults) {
    const k = key as keyof P;
    if (k in DEFAULT_SHARED_PROPS) {
      sharedProps[key] = propsWithDefaults[k];
    } else {
      rest[key] = propsWithDefaults[k];
    }
  }

  return {
    rest: rest as Omit<D & Omit<P, keyof D>, keyof SharedProps>,
    sharedProps: sharedProps as Required<{ [K in keyof SharedProps]: P[K] }>
  };
};
