import type { SharedValue } from 'react-native-reanimated';

export type JustifyContent =
  | 'center'
  | 'flex-end'
  | 'flex-start'
  | 'space-around'
  | 'space-between'
  | 'space-evenly';
export type AlignContent =
  | 'center'
  | 'flex-end'
  | 'flex-start'
  | 'space-around' // TODO: add support
  | 'space-between' // TODO: add support
  | 'space-evenly' // TODO: add support
  | 'stretch';
export type AlignItems = 'center' | 'flex-end' | 'flex-start' | 'stretch';
export type FlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse';

export type RowFlexDirection = 'row' | 'row-reverse';
export type ColumnFlexDirection = 'column' | 'column-reverse';
export type FlexDirection = ColumnFlexDirection | RowFlexDirection;

export type FlexProps = Partial<{
  justifyContent: JustifyContent;
  alignContent: AlignContent;
  alignItems: AlignItems;
  flexWrap: FlexWrap;
  flexDirection: FlexDirection;
  rowGap: number;
  columnGap: number;
  gap: number;
}>;

type SharedFLexAxisParams = {
  gaps: {
    main: SharedValue<number>;
    cross: SharedValue<number>;
  };
};

export type FlexRowAxisParams = {
  coordinates: {
    main: 'x';
    cross: 'y';
  };
  dimensions: {
    main: 'width';
    cross: 'height';
  };
} & SharedFLexAxisParams;

export type FlexColumnAxisParams = {
  coordinates: {
    main: 'y';
    cross: 'x';
  };
  dimensions: {
    main: 'height';
    cross: 'width';
  };
} & SharedFLexAxisParams;
