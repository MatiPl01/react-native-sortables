export type JustifyContent =
  | 'center'
  | 'flex-end'
  | 'flex-start'
  | 'space-around' //
  | 'space-between'
  | 'space-evenly'; //
export type AlignContent =
  | 'center'
  | 'flex-end'
  | 'flex-start'
  | 'space-around'
  | 'space-between'
  | 'space-evenly'
  | 'stretch';
export type AlignItems = 'center' | 'flex-end' | 'flex-start' | 'stretch';
export type FlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse';
export type FlexDirection = 'column' | 'column-reverse' | 'row' | 'row-reverse';

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
