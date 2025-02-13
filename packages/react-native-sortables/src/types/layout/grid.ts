import type { Dimensions, Vector } from './shared';

export type GridLayoutProps = {
  columnWidth: null | number;
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
  totalDimensions: Partial<Dimensions>;
};
