import type { Dimensions } from '../../../types';

export type FlexProps = Partial<{
  justifyContent:
    | 'center'
    | 'flex-end'
    | 'flex-start'
    | 'space-around'
    | 'space-between'
    | 'space-evenly';
  alignContent:
    | 'center'
    | 'flex-end'
    | 'flex-start'
    | 'space-around'
    | 'space-between'
    | 'space-evenly'
    | 'stretch';
  alignItems: 'baseline' | 'center' | 'flex-end' | 'flex-start' | 'stretch';
  flexWrap: 'nowrap' | 'wrap' | 'wrap-reverse';
  flexDirection: 'column' | 'column-reverse' | 'row' | 'row-reverse';
  rowGap: number;
  columnGap: number;
  gap: number;
}>;

export type ItemGroups = Array<{
  items: Array<string>;
  dimensions: Dimensions;
}>;
