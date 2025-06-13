/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';

import { DEFAULT_SHARED_PROPS, STYLE_PROPS } from '../constants/props';
import type { RequiredBy, SharedProps } from '../types';

const hasStyleProp = <K extends string, P extends Record<string, any>>(
  styleKey: K,
  props: P
): props is P & { [key in K]: ViewStyle } => {
  return styleKey in props;
};

type PropsWithDefaults<
  P extends Record<string, any>,
  D extends Record<string, any>
> = {
  sharedProps: Required<{ [K in keyof SharedProps]: P[K] }>;
  rest: Omit<
    Omit<P, keyof D> & RequiredBy<P, keyof D & keyof P>,
    keyof SharedProps
  >;
};

export const getPropsWithDefaults = <
  P extends Record<string, any>,
  D extends Record<string, any>
>(
  props: P,
  componentDefaultProps: D
): PropsWithDefaults<P, D> => {
  const propsWithDefaults = {
    ...DEFAULT_SHARED_PROPS,
    ...componentDefaultProps
  } as unknown as P;

  for (const key in props) {
    if (props[key] !== undefined) {
      propsWithDefaults[key] = props[key];
    }
  }

  // merge styles from props and defaults
  for (const styleKey of STYLE_PROPS) {
    if (hasStyleProp(styleKey, propsWithDefaults)) {
      const style: ViewStyle = {
        ...(hasStyleProp(styleKey, DEFAULT_SHARED_PROPS) &&
          DEFAULT_SHARED_PROPS[styleKey]),
        ...(hasStyleProp(styleKey, componentDefaultProps) &&
          componentDefaultProps[styleKey])
      };

      const propsStyle = hasStyleProp(styleKey, props)
        ? StyleSheet.flatten(props[styleKey])
        : {};

      // Only override defaultStyle with defined values from propsStyle
      Object.entries(propsStyle).forEach(([key, value]) => {
        if (value !== undefined) {
          // @ts-expect-error This is fine
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          style[key] = value;
        }
      });

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

  return { rest, sharedProps } as PropsWithDefaults<P, D>;
};
