import type { PropsWithChildren } from 'react';

import type {
  AlignContent,
  AlignItems,
  FlexDirection,
  FlexWrap,
  JustifyContent
} from '../layout/flex';
import type {
  CommonValuesContextType,
  DebugProviderContextType,
  FlexLayoutContextType,
  OrderUpdater
} from '../providers';
import type { Simplify } from '../utils';
import type { DragEndParams, SharedProps } from './shared';

export type SortableFlexDragEndParams = {
  order: <I>(data: Array<I>) => Array<I>;
} & DragEndParams;

export type SortableFlexDragEndCallback = (
  params: SortableFlexDragEndParams
) => void;

export type SortableFlexStrategyFactory = (
  props: Simplify<
    { debugContext?: DebugProviderContextType } & CommonValuesContextType &
      FlexLayoutContextType
  >
) => OrderUpdater;

export type SortableFlexStrategy = 'insert' | SortableFlexStrategyFactory;

export type SortableFlexStyle = {
  alignContent?: AlignContent;
  justifyContent?: JustifyContent;
  alignItems?: AlignItems;
  flexDirection?: FlexDirection;
  flexWrap?: FlexWrap;
  gap?: number;
  rowGap?: number;
  columnGap?: number;
  height?: 'fill' | number;
  width?: 'fill' | number;
  minHeight?: number;
  minWidth?: number;
  maxHeight?: number;
  maxWidth?: number;
  padding?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingLeft?: number;
  paddingBottom?: number;
  paddingVertical?: number;
  paddingHorizontal?: number;
};

export type SortableFlexProps = Simplify<
  PropsWithChildren<
    {
      strategy?: SortableFlexStrategy;
      onDragEnd?: SortableFlexDragEndCallback;
    } & Omit<SharedProps, 'onDragEnd'> &
      SortableFlexStyle
  >
>;
