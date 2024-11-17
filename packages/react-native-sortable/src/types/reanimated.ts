import type {
  BaseAnimationBuilder,
  EntryExitAnimationFunction
} from 'react-native-reanimated';

export type LayoutAnimation =
  | BaseAnimationBuilder
  | EntryExitAnimationFunction
  | typeof BaseAnimationBuilder;
