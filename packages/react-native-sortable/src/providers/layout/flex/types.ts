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

export type FlexProps = {
  gap: number;
  rowGap?: number;
  columnGap?: number;
} & Pick<
  ViewStyle,
  'height' | 'maxHeight' | 'maxWidth' | 'minHeight' | 'minWidth' | 'width'
> &
  Required<
    Pick<
      ViewStyle,
      | 'alignContent'
      | 'alignItems'
      | 'flexDirection'
      | 'flexWrap'
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
  measuredContainerDimensions: Dimensions;
  providedContainerDimensions?: Dimensions;
};

export type FlexLayout = {
  itemGroups: Array<Array<string>>;
  itemPositions: Record<string, Vector>;
  crossAxisGroupOffsets: Array<number>;
  containerHeight: number;
};
