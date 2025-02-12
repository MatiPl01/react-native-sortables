import type {
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
