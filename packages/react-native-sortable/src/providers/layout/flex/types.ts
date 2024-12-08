import type { ViewStyle } from 'react-native';

import type { Dimensions, NoUndef, Vector } from '../../../types';

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

type RequiredProps = 'flexDirection' | 'flexWrap' | 'gap' | 'justifyContent';

export type FlexProps = {
  alignContent: AlignContent;
  alignItems: AlignItems;
} & Omit<ViewStyle, RequiredProps> &
  Required<Pick<ViewStyle, RequiredProps>>;

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
  referenceContainerDimensions: Partial<Dimensions>;
};

export type FlexLayout = {
  itemGroups: Array<Array<string>>;
  itemPositions: Record<string, Vector>;
  crossAxisGroupOffsets: Array<number>;
  crossAxisGroupSizes: Array<number>;
  totalHeight: number;
};
