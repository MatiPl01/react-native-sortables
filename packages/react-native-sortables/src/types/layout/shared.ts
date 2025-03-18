import type { SharedValue } from 'react-native-reanimated';

export type Dimensions = {
  width: number;
  height: number;
};

export type MeasureCallback = (width: number, height: number) => void;

export type Vector = {
  x: number;
  y: number;
};

export type AnimatedVector = {
  x: SharedValue<null | number>;
  y: SharedValue<null | number>;
};

export type Dimension = keyof Dimensions;

export type Direction = 'column' | 'row';

export type Coordinate = keyof Vector;
