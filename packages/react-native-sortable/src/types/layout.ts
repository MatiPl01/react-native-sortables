import type { SharedValue } from 'react-native-reanimated';

export type Dimensions = {
  width: number;
  height: number;
};

export type Position = {
  x: number;
  y: number;
};

export type AnimatedOptionalPosition = {
  x: SharedValue<null | number>;
  y: SharedValue<null | number>;
};

export type Dimension = keyof Dimensions;

export type Coordinate = keyof Position;
