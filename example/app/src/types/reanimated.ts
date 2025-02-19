import type { SharedValue } from 'react-native-reanimated';

export type Animatable<T> = SharedValue<T> | T;
