import type { Dimensions, Vector } from './shared';

export type GridLayoutProps = {
  mainGroupSize: null | number;
  gaps: {
    main: number;
    cross: number;
  };
  itemHeights: number | Record<string, number>;
  itemWidths: number | Record<string, number>;
  indexToKey: Array<string>;
  isVertical: boolean;
  numGroups: number;
};

export type GridLayout = {
  itemPositions: Record<string, Vector>;
  crossAxisOffsets: Array<number>;
  controlledContainerDimensions: Partial<Dimensions>;
};
