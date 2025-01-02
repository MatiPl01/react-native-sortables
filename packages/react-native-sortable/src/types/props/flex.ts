import type { StyleProp, ViewProps, ViewStyle } from 'react-native';

import type { AlignContent, AlignItems } from '../layout/flex';
import type {
  CommonValuesContextType,
  DebugProviderContextType,
  FlexLayoutContextType,
  OrderUpdater
} from '../providers';
import type { DragEndParams, SharedProps } from './shared';

export type SortableFlexDragEndParams = {
  order: <I>(data: Array<I>) => Array<I>;
} & DragEndParams;

export type SortableFlexDragEndCallback = (
  params: SortableFlexDragEndParams
) => void;

export type SortableFlexStrategyFactory = (
  props: { debugContext?: DebugProviderContextType } & CommonValuesContextType &
    FlexLayoutContextType
) => OrderUpdater;

export type SortableFlexStrategy = 'insert' | SortableFlexStrategyFactory;

export type SortableFlexStyle = {
  alignContent?: AlignContent;
  alignItems?: AlignItems;
} & Omit<ViewStyle, 'alignContent' | 'alignItems'>;

export type SortableFlexProps = {
  strategy?: SortableFlexStrategy;
  onDragEnd?: SortableFlexDragEndCallback;
  style?: StyleProp<SortableFlexStyle>;
} & Omit<SharedProps, 'onDragEnd'> &
  Omit<ViewProps, 'style'>;
