import type { ViewStyle } from 'react-native';

import type { NoUndef } from '../utils';
import type { Dimensions, Vector } from './shared';

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

export type FlexLayoutProps = {
  gaps: {
    row: number;
    column: number;
  };
  itemDimensions: Record<string, Dimensions>;
  indexToKey: Array<string>;
  flexDirection: FlexDirection;
  flexWrap: FlexWrap;
  flexAlignments: FlexAlignments;
  containerWidth: number;
};

export type FlexLayout = {
  itemGroups: Array<Array<string>>;
  itemPositions: Record<string, Vector>;
  crossAxisGroupOffsets: Array<number>;
  crossAxisGroupSizes: Array<number>;
  totalHeight: number;
};
