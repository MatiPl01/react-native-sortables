/* eslint-disable @typescript-eslint/no-explicit-any */

import { StyleSheet, type ViewStyle } from 'react-native';

import { DEFAULT_SHARED_PROPS } from '../constants/props';
import type { SharedProps } from '../types';

const hasStyleProp = <P extends Record<string, any>>(
  props: P
): props is { style: Array<ViewStyle> | ViewStyle } & P => {
  return 'style' in props;
};

export const getPropsWithDefaults = <
  P extends Record<string, any>,
  D extends Record<string, any>
>(
  props: P,
  componentDefaultProps: D
): {
  sharedProps: Required<SharedProps>;
  rest: Omit<D & Omit<P, keyof D>, keyof SharedProps>;
} => {
  const propsWithDefaults = {
    ...DEFAULT_SHARED_PROPS,
    ...componentDefaultProps,
    ...props
  };

  // merge styles from props and defaults
  if (hasStyleProp(propsWithDefaults)) {
    const style = StyleSheet.flatten(
      [
        hasStyleProp(componentDefaultProps) && componentDefaultProps.style,
        hasStyleProp(props) && props.style
      ].filter(Boolean)
    );
    propsWithDefaults.style = style;
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
    sharedProps: sharedProps as Required<SharedProps>
  };
};
