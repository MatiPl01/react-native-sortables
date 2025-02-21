import type { ComponentType } from 'react';
import type { ViewStyle } from 'react-native';
import type { AnimatedRef, SharedValue } from 'react-native-reanimated';

import type { Vector } from '../layout/shared';
import type { LayoutAnimation, LayoutTransition } from '../reanimated';
import type { Animatable, AnimatableProps, Simplify } from '../utils';

export type DropIndicatorComponentProps = {
  activeAnimationProgress: SharedValue<number>;
  activeItemKey: SharedValue<null | string>;
  dropIndex: SharedValue<number>;
  dropPosition: SharedValue<Vector>;
  orderedItemKeys: SharedValue<Array<string>>;
  style: ViewStyle;
};

export type ActiveItemDecorationSettings = AnimatableProps<{
  activeItemScale: number;
  activeItemOpacity: number;
  activeItemShadowOpacity: number;
  inactiveItemOpacity: number;
  inactiveItemScale: number;
}>;

export type Offset = `${number}%` | number;
export type OverDrag = 'both' | 'horizontal' | 'none' | 'vertical';
export type ReorderTriggerOrigin = 'center' | 'touch';

export type ItemDragSettings = {
  overDrag: OverDrag;
  reorderTriggerOrigin: ReorderTriggerOrigin;
} & AnimatableProps<{
  dragActivationDelay: number;
  activationAnimationDuration: number;
  dropAnimationDuration: number;
  dragActivationFailOffset: number;
}>;

export type ActiveItemSnapSettings = AnimatableProps<{
  enableActiveItemSnap: boolean;
  snapOffsetX: Offset;
  snapOffsetY: Offset;
}>;

export type AutoScrollSettings = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scrollableRef: AnimatedRef<any>; // TODO - type this properly
  autoScrollDirection: 'horizontal' | 'vertical';
} & AnimatableProps<{
  autoScrollActivationOffset: [number, number] | number;
  autoScrollSpeed: number;
  autoScrollEnabled: boolean;
}>;

export type DropIndicatorSettings = {
  DropIndicatorComponent: ComponentType<DropIndicatorComponentProps>;
  showDropIndicator: boolean;
  dropIndicatorStyle: ViewStyle;
};

export type ItemsLayoutTransitionMode = 'all' | 'reorder';

export type ItemLayoutAnimationSettings = {
  itemEntering: LayoutAnimation | null;
  itemExiting: LayoutAnimation | null;
  itemsLayout: LayoutTransition | null;
  itemsLayoutTransitionMode: ItemsLayoutTransitionMode;
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

export type Overflow = 'hidden' | 'visible';

export type SharedProps = Simplify<
  Omit<SortableCallbacks, 'onDragEnd'> &
    Partial<
      {
        animateHeight: boolean;
        animateWidth: boolean;
        hapticsEnabled: boolean;
        sortEnabled: Animatable<boolean>;
        customHandle: boolean;
        overflow: Overflow;
        debug: boolean;
      } & ActiveItemDecorationSettings &
        ActiveItemSnapSettings &
        AutoScrollSettings &
        DropIndicatorSettings &
        ItemDragSettings &
        ItemLayoutAnimationSettings
    >
>;
