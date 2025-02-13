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

export type ItemDragSettings = {
  overDrag: OverDrag;
} & AnimatableProps<{
  dragActivationDelay: number;
  dragActivationFailOffset: number;
  activeAnimationDuration: number;
  dropAnimationDuration: number;
}>;

export type ActiveItemSnapSettings = AnimatableProps<{
  enableActiveItemSnap: boolean;
  snapOffsetX: Offset;
  snapOffsetY: Offset;
}>;

export type AutoScrollSettings = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scrollableRef: AnimatedRef<any>; // TODO - type this properly
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

export type ItemLayoutAnimationSettings = {
  itemEntering: LayoutAnimation | undefined;
  itemExiting: LayoutAnimation | undefined;
  itemLayout: LayoutTransition | undefined;
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
    animateWidth?: boolean;
    hapticsEnabled?: boolean;
    sortEnabled?: Animatable<boolean>;
    customHandle?: boolean;
    debug?: boolean;
  } & Omit<SortableCallbacks, 'onDragEnd'> &
    Partial<ActiveItemDecorationSettings> &
    Partial<ActiveItemSnapSettings> &
    Partial<AutoScrollSettings> &
    Partial<DropIndicatorSettings> &
    Partial<ItemDragSettings> &
    Partial<ItemLayoutAnimationSettings>
>;
