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

export type SortableCallbacks = {
  onDragStart?: (params: { key: string; fromIndex: number }) => void;
  onDragEnd?: (params: {
    key: string;
    fromIndex: number;
    toIndex: number;
  }) => void;
  onOrderChange?: (params: {
    newOrder: Array<string>;
    fromIndex: number;
    toIndex: number;
    key: string;
  }) => void;
};

export type ReorderStrategy = 'insert' | 'swap';

export type SharedProps = Prettify<
  {
    dragEnabled?: boolean;
    reorderStrategy?: ReorderStrategy;
  } & Partial<ActiveItemDecorationSettings> &
    Partial<AutoScrollSettings> &
    Partial<DropIndicatorSettings> &
    SortableCallbacks
>;
