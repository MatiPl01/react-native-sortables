import type { Dimensions, Vector } from './shared';

export type GridLayoutProps = {
  columnWidth: number;
  gaps: {
    row: number;
    column: number;
  };
  itemDimensions: Record<string, Dimensions>;
  indexToKey: Array<string>;
  numColumns: number;
};

export type GridLayout = {
  rowOffsets: Array<number>;
  itemPositions: Record<string, Vector>;
  containerHeight: number;
};
