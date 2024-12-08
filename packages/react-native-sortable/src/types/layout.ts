export type Dimensions = {
  width: number;
  height: number;
};

export type Vector = {
  x: number;
  y: number;
};

export type Dimension = keyof Dimensions;

export type Direction = 'column' | 'row';

export type Coordinate = keyof Vector;
