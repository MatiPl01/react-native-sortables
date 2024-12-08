import type { ViewStyle } from 'react-native';

import type { Dimensions, NoUndef, Vector } from '../../../types';

export type AlignContent = NoUndef<ViewStyle['alignContent']>;
export type JustifyContent = NoUndef<ViewStyle['justifyContent']>;
export type AlignItems = NoUndef<ViewStyle['alignItems']>;
export type FlexWrap = NoUndef<ViewStyle['flexWrap']>;
export type FlexDirection = NoUndef<ViewStyle['flexDirection']>;

export type FlexAlignments = {
  alignContent: AlignContent;
  justifyContent: JustifyContent;
  alignItems: AlignItems;
};

export type FlexProps = Pick<
  ViewStyle,
  | 'columnGap'
  | 'height'
  | 'maxHeight'
  | 'maxWidth'
  | 'minHeight'
  | 'minWidth'
  | 'rowGap'
  | 'width'
> &
  Required<
    Pick<
      ViewStyle,
      | 'alignContent'
      | 'alignItems'
      | 'flexDirection'
      | 'flexWrap'
      | 'gap'
      | 'justifyContent'
    >
  >;

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
