import type { ViewStyle } from 'react-native';

import type { NoUndef } from '../../helperTypes';
import type { Dimensions, ItemSizes, Vector } from './shared';

export type AlignContent = Exclude<
  NoUndef<ViewStyle['alignContent']>,
  'stretch'
>;
export type AlignItems = Exclude<NoUndef<ViewStyle['alignItems']>, 'stretch'>;
export type JustifyContent = NoUndef<ViewStyle['justifyContent']>;
export type FlexWrap = NoUndef<ViewStyle['flexWrap']>;
export type FlexDirection = NoUndef<ViewStyle['flexDirection']>;

export type FlexAlignments = {
  alignContent: AlignContent;
  justifyContent: JustifyContent;
  alignItems: AlignItems;
};

export type DimensionLimits = {
  minHeight: number;
  maxHeight: number;
  minWidth: number;
  maxWidth: number;
};

export type Paddings = {
  bottom: number;
  left: number;
  right: number;
  top: number;
};

export type FlexLayoutProps = {
  gaps: {
    row: number;
    column: number;
  };
  itemWidths: ItemSizes;
  itemHeights: ItemSizes;
  indexToKey: Array<string>;
  flexDirection: FlexDirection;
  flexWrap: FlexWrap;
  flexAlignments: FlexAlignments;
  limits: DimensionLimits | null;
  paddings: Paddings;
};

export type FlexLayout = {
  itemGroups: Array<Array<string>>;
  itemPositions: Record<string, Vector>;
  crossAxisGroupOffsets: Array<number>;
  crossAxisGroupSizes: Array<number>;
  totalDimensions: Dimensions;
  adjustedCrossGap: number;
  groupSizeLimit: number;
  contentBounds: [Vector, Vector];
};
