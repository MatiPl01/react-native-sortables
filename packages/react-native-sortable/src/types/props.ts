import type { ComponentType } from 'react';
import type { AnimatedRef } from 'react-native-reanimated';

import type { DropIndicatorComponentProps } from '../components';
import type { AnimatableValues, Prettify } from './utils';

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
};

export type DragStartParams = {
  key: string;
  fromIndex: number;
};

export type DragEndParams = {
  key: string;
  fromIndex: number;
  toIndex: number;
};

export type OrderChangeParams = {
  newOrder: Array<string>;
  fromIndex: number;
  toIndex: number;
  key: string;
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

export type SharedProps = Prettify<
  {
    dragEnabled?: boolean;
    hapticsEnabled?: boolean;
    reorderStrategy?: ReorderStrategy;
  } & Partial<ActiveItemDecorationSettings> &
    Partial<ActiveItemSnapSettings> &
    Partial<AutoScrollSettings> &
    Partial<DropIndicatorSettings> &
    SortableCallbacks
>;
