import type { StyleProp, ViewStyle } from 'react-native';
import type {
  AnimatedStyle,
  BaseAnimationBuilder,
  EntryExitAnimationFunction,
  LayoutAnimationFunction,
  SharedValue
} from 'react-native-reanimated';

import type { AnyRecord } from '../../helperTypes';

export type LayoutAnimation =
  | BaseAnimationBuilder
  | EntryExitAnimationFunction
  | typeof BaseAnimationBuilder;

export type LayoutTransition =
  | BaseAnimationBuilder
  | LayoutAnimationFunction
  | typeof BaseAnimationBuilder;

export type AnimatedStyleProp = StyleProp<AnimatedStyle<ViewStyle>>;

export type Animatable<V> = SharedValue<V> | V;

type UnAnimatable<V> = V extends SharedValue<infer U> ? U : V;

export type AnimatableProps<T extends AnyRecord> = {
  [K in keyof T]: Animatable<UnAnimatable<T[K]>>;
};

export type AnimatedValues<T extends AnyRecord> = {
  [K in keyof T]: SharedValue<UnAnimatable<T[K]>>;
};
