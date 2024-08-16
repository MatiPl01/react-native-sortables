import type { ComponentType } from 'react';
import type { ViewProps, ViewStyle } from 'react-native';
import type { AnimatedRef } from 'react-native-reanimated';

import type { DropIndicatorComponentProps } from '../components';
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

export type DragStartParams = {
  key: string;
  fromIndex: number;
  reorderStrategy: ReorderStrategy;
};

export type DragEndParams = {
  key: string;
  fromIndex: number;
  toIndex: number;
  reorderStrategy: ReorderStrategy;
};

export type OrderChangeParams = {
  newOrder: Array<string>;
  fromIndex: number;
  toIndex: number;
  key: string;
  reorderStrategy: ReorderStrategy;
};

export type DragStartCallback = (params: DragStartParams) => void;
export type DragEndCallback = (params: DragEndParams) => void;
export type OrderChangeCallback = (params: OrderChangeParams) => void;

export type SortableCallbacks = {
  onDragStart?: DragStartCallback;
  onDragEnd?: DragEndCallback;
  onOrderChange?: OrderChangeCallback;
};

export type ReorderStrategy = 'insert' | 'swap';

export type SharedProps = Simplify<
  {
    sortEnabled?: boolean;
    hapticsEnabled?: boolean;
    reorderStrategy?: ReorderStrategy;
  } & Partial<ActiveItemDecorationSettings> &
    Partial<ActiveItemSnapSettings> &
    Partial<AutoScrollSettings> &
    Partial<DropIndicatorSettings> &
    SortableCallbacks
>;

/**
 * SORTABLE GRID PROPS
 */
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

export type SortableGridProps<I> = Simplify<
  {
    data: Array<I>;
    renderItem: SortableGridRenderItem<I>;
    keyExtractor?: (item: I, index: number) => string;
    onOrderChange?: (
      params: Simplify<{ data: Array<I> } & OrderChangeParams>
    ) => void;
  } & Omit<SharedProps, 'onOrderChange'> &
    Partial<SortableGridLayoutSettings>
>;

/**
 * SORTABLE FLEX PROPS
 */
export type SortableFlexProps = SharedProps & ViewProps;
