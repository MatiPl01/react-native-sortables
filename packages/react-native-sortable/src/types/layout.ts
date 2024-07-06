export type Dimensions = {
  width: number;
  height: number;
};

export type Position = {
  x: number;
  y: number;
};

export type Dimension = keyof Dimensions;

export type Coordinate = keyof Position;
