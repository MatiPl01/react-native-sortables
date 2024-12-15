import type { ComponentType } from 'react';
import type { ViewProps, ViewStyle } from 'react-native';
import type { AnimatedRef } from 'react-native-reanimated';

import type { DropIndicatorComponentProps } from '../components';
import type { DebugProviderContextType } from '../debug';
import type {
  AlignContent,
  AlignItems,
  CommonValuesContextType,
  FlexLayoutContextType,
  GridLayoutContextType,
  OrderUpdater
} from '../providers';
import type { LayoutAnimation } from './reanimated';
import type { AnimatableValues, Simplify } from './utils';

/**
 * SHARED PROPS
 */

export type ActiveItemDecorationSettings = AnimatableValues<{
  activeItemScale: number;
  activeItemOpacity: number;
  activeItemShadowOpacity: number;
  inactiveItemOpacity: number;
  inactiveItemScale: number;
}>;

export type Offset = `${number}%` | number;

export type ActiveItemSnapSettings = AnimatableValues<{
  enableActiveItemSnap: boolean;
  snapOffsetX: Offset;
  snapOffsetY: Offset;
}>;

export type AutoScrollSettings = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scrollableRef: AnimatedRef<any>; // TODO - type this properly
} & AnimatableValues<{
  autoScrollActivationOffset: [number, number] | number;
  autoScrollSpeed: number;
  autoScrollEnabled: boolean;
}>;

export type DropIndicatorSettings = {
  DropIndicatorComponent: ComponentType<DropIndicatorComponentProps>;
  showDropIndicator: boolean;
  dropIndicatorStyle: ViewStyle;
};

export type ItemLayoutAnimationSettings = {
  itemEntering: LayoutAnimation;
  itemExiting: LayoutAnimation;
};

export type DragStartParams = {
  key: string;
  fromIndex: number;
};

export type DragEndParams = {
  key: string;
  fromIndex: number;
  toIndex: number;
  indexToKey: Array<string>;
  keyToIndex: Record<string, number>;
};

export type OrderChangeParams = {
  fromIndex: number;
  toIndex: number;
  key: string;
  indexToKey: Array<string>;
  keyToIndex: Record<string, number>;
};

export type DragStartCallback = (params: DragStartParams) => void;
export type DragEndCallback = (params: DragEndParams) => void;
export type OrderChangeCallback = (params: OrderChangeParams) => void;

export type SortableCallbacks = {
  onDragStart?: DragStartCallback;
  onDragEnd?: DragEndCallback;
  onOrderChange?: OrderChangeCallback;
};

export type SharedProps = Simplify<
  {
    animateHeight?: boolean;
    sortEnabled?: boolean;
    hapticsEnabled?: boolean;
    debug?: boolean;
  } & Partial<ActiveItemDecorationSettings> &
    Partial<ActiveItemSnapSettings> &
    Partial<AutoScrollSettings> &
    Partial<DropIndicatorSettings> &
    Partial<ItemLayoutAnimationSettings> &
    SortableCallbacks
>;

/**
 * SORTABLE GRID PROPS
 */
export type SortableGridDragEndParams<I> = {
  data: Array<I>;
} & DragEndParams;

export type SortableGridDragEndCallback<I> = (
  params: SortableGridDragEndParams<I>
) => void;

export type SortableGridLayoutSettings = {
  columns: number;
} & AnimatableValues<{
  rowGap: number;
  columnGap: number;
}>;

export type SortableGridRenderItemInfo<I> = {
  item: I;
};

export type SortableGridRenderItem<I> = (
  info: SortableGridRenderItemInfo<I>
) => JSX.Element;

export type SortableGridStrategyFactory = (
  props: { debugContext?: DebugProviderContextType } & CommonValuesContextType &
    GridLayoutContextType
) => OrderUpdater;

export type SortableGridStrategy =
  | 'insert'
  | 'swap'
  | SortableGridStrategyFactory;

export type SortableGridProps<I> = Simplify<
  {
    data: Array<I>;
    renderItem: SortableGridRenderItem<I>;
    strategy?: SortableGridStrategy;
    onDragEnd?: SortableGridDragEndCallback<I>;
    keyExtractor?: (item: I, index: number) => string;
  } & Omit<SharedProps, 'onDragEnd'> &
    Partial<SortableGridLayoutSettings>
>;

/**
 * SORTABLE FLEX PROPS
 */
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

export type SortableFlexProps = {
  strategy?: SortableFlexStrategy;
  onDragEnd?: SortableFlexDragEndCallback;
  style: {
    alignContent?: AlignContent;
    alignItems?: AlignItems;
  } & Omit<ViewStyle, 'alignContent' | 'alignItems'>;
} & Omit<SharedProps, 'onDragEnd'> &
  Omit<ViewProps, 'style'>;
