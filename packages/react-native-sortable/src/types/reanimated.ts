import type { ViewStyle } from 'react-native';
import type { AnimatedStyle } from 'react-native-reanimated';

export type AnimatedViewStyle =
  | AnimatedStyle<ViewStyle>
  | Array<AnimatedStyle<ViewStyle>>;
