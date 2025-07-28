import type { ControlledSizes, Dimensions, Vector } from './shared';

export type GridLayoutProps = {
  mainGroupSize: null | number;
  gaps: {
    main: number;
    cross: number;
  };
  itemHeights: ControlledSizes;
  itemWidths: ControlledSizes;
  indexToKey: Array<string>;
  isVertical: boolean;
  numGroups: number;
};

export type GridLayout = {
  itemPositions: Record<string, Vector>;
  crossAxisOffsets: Array<number>;
  controlledContainerDimensions: Partial<Dimensions>;
};
