import type { Coordinate, Dimensions, ItemSizes, Vector } from './shared';

export type GridLayoutProps = {
  gaps: {
    main: number;
    cross: number;
  };
  itemHeights: ItemSizes;
  itemWidths: ItemSizes;
  indexToKey: Array<string>;
  isVertical: boolean;
  numGroups: number;
};

export type GridLayout = {
  itemPositions: Record<string, Vector>;
  crossAxisOffsets: Array<number>;
  controlledContainerDimensions: Partial<Dimensions>;
};

export type AdditionalCrossOffsetProps = {
  activeItemKey: string;
  indexToKey: Array<string>;
  keyToIndex: Record<string, number>;
  itemPositions: Record<string, Vector>;
  crossGap: number;
  crossItemSizes: ItemSizes;
  crossCoordinate: Coordinate;
  numGroups: number;
};
