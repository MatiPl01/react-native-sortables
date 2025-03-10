import type { StyleProp, ViewStyle } from 'react-native';
import type {
  AnimatedStyle,
  BaseAnimationBuilder,
  EntryExitAnimationFunction,
  LayoutAnimationFunction
} from 'react-native-reanimated';

export type LayoutAnimation =
  | BaseAnimationBuilder
  | EntryExitAnimationFunction
  | typeof BaseAnimationBuilder;

export type LayoutTransition =
  | BaseAnimationBuilder
  | LayoutAnimationFunction
  | typeof BaseAnimationBuilder;

export type AnimatedStyleProp = StyleProp<AnimatedStyle<ViewStyle>>;
