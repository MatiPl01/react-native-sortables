export type Dimensions = {
  width: number;
  height: number;
};

export type MeasureCallback = (width: number, height: number) => void;

export type Vector = {
  x: number;
  y: number;
};

export type Dimension = keyof Dimensions;

export type Direction = 'column' | 'row';

export type Coordinate = keyof Vector;

export type ReorderFunction = (
  indexToKey: Array<string>,
  activeIndex: number,
  newIndex: number,
  fixedItemKeys: Record<string, boolean> | undefined
) => Array<string>;
