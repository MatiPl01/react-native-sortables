import type { Dimensions, Vector } from './shared';

export type GridLayoutProps = {
  mainGroupSize: null | number;
  gaps: {
    main: number;
    cross: number;
  };
  itemDimensions: Record<string, Dimensions>;
  indexToKey: Array<string>;
  numGroups: number;
  isVertical: boolean;
};

export type GridLayout = {
  itemPositions: Record<string, Vector>;
  crossAxisOffsets: Array<number>;
  calculatedDimensions: Partial<Dimensions>;
};
