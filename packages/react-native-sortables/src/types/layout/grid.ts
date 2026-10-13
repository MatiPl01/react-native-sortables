import type { Maybe } from '../../helperTypes';
import type { ItemSizes, Vector } from './shared';

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
  shouldAnimateLayout?: boolean;
  requestNextLayout?: boolean;
  startCrossOffset?: Maybe<number>;
  masonry?: boolean;
};

export type GridLayout = {
  itemPositions: Record<string, Vector>;
  crossAxisOffsets: Array<number>;
  containerCrossSize: number;
  contentBounds: [Vector, Vector];
};

export type AutoOffsetAdjustmentProps = {
  itemKey: string;
  crossGap: number;
  crossItemSizes: ItemSizes;
  indexToKey: Array<string>;
  numGroups: number;
  masonry?: boolean;
};
