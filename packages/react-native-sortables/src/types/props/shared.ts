import type { ComponentType } from 'react';
import type { ViewStyle } from 'react-native';
import type { TouchData } from 'react-native-gesture-handler';
import type { AnimatedRef, SharedValue } from 'react-native-reanimated';

import type { Vector } from '../layout/shared';
import type { LayoutAnimation, LayoutTransition } from '../reanimated';
import type { Animatable, AnimatableProps, Simplify } from '../utils';

/** Props passed to a custom drop indicator component.
 * The drop indicator shows where the dragged item will be placed when dropped.
 * Almost all values are provided as Reanimated shared values for fast updates.
 */
export type DropIndicatorComponentProps = {
  /** Progress of the active item animation (from 0 to 1) */
  activeAnimationProgress: SharedValue<number>;
  /** Key of the currently dragged item, or null if no item is being dragged */
  activeItemKey: SharedValue<null | string>;
  /** Current index where the dragged item would be dropped */
  dropIndex: SharedValue<number>;
  /** Current position where the item would be dropped */
  dropPosition: SharedValue<Vector>;
  /** Array of item keys in their current order */
  orderedItemKeys: SharedValue<Array<string>>;
  /** Style to be applied to the drop indicator */
  style: ViewStyle;
};

export type ActiveItemDecorationSettings = AnimatableProps<{
  /** Scale factor applied to the item being dragged */
  activeItemScale: number;
  /** Opacity of the item being dragged */
  activeItemOpacity: number;
  /** Shadow opacity of the item being dragged */
  activeItemShadowOpacity: number;
  /** Opacity of items that are not being dragged */
  inactiveItemOpacity: number;
  /** Scale factor applied to items that are not being dragged */
  inactiveItemScale: number;
}>;

/**
 * Percentage (relative to the container size) or number (absolute value) distance
 * @example
 * - '10%' - 10% of the container width/height
 * - 50 - 50 pixels
 * - [10, 20] - 10% of the container width/height and 20 pixels
 */
export type Offset = `${number}%` | number;
/** Direction in which items can be dragged beyond container bounds */
export type OverDrag = 'both' | 'horizontal' | 'none' | 'vertical';
/** Position of the reordering trigger point */
export type ReorderTriggerOrigin = 'center' | 'touch';

export type ItemDragSettings = AnimatableProps<{
  /** Delay in ms before drag gesture is activated */
  dragActivationDelay: number;
  /** Duration of the animation when item becomes active */
  activationAnimationDuration: number;
  /** Duration of the animation when item is dropped */
  dropAnimationDuration: number;
  /** Maximum distance in pixels that the pointer can move from the drag start
   * point before the drag is cancelled (only before drag starts)
   */
  dragActivationFailOffset: number;
}> & {
  /** Controls in which directions items can be dragged beyond container bounds */
  overDrag: OverDrag;
  /** Determines whether reordering is triggered from item center or touch point */
  reorderTriggerOrigin: ReorderTriggerOrigin;
};

export type ActiveItemSnapSettings = AnimatableProps<{
  /** Whether the active item should snap to the finger */
  enableActiveItemSnap: boolean;
  /** Horizontal snap offset of the item */
  snapOffsetX: Offset;
  /** Vertical snap offset of the item */
  snapOffsetY: Offset;
}>;

export type AutoScrollSettings = AnimatableProps<{
  /** Distance from the edge of the container that triggers auto-scrolling. Can be a single number or [top/left, bottom/right] tuple */
  autoScrollActivationOffset: [number, number] | number;
  /** Speed at which auto-scrolling occurs */
  autoScrollSpeed: number;
  /** Whether auto-scrolling is enabled */
  autoScrollEnabled: boolean;
}> & {
  /** Reference to the animated scrollable container which will be scrolled
   * automatically when the active item is dragged near the edges of the container
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scrollableRef: AnimatedRef<any>; // TODO - type this properly
  /** Direction in which auto-scrolling should occur */
  autoScrollDirection: 'horizontal' | 'vertical';
};

export type DropIndicatorSettings = {
  /** Component to render as the drop indicator */
  DropIndicatorComponent: ComponentType<DropIndicatorComponentProps>;
  /** Whether to show the drop indicator while dragging */
  showDropIndicator: boolean;
  /** Style to apply to the drop indicator */
  dropIndicatorStyle: ViewStyle;
};

/**
 * Controls when layout transitions are applied
 * - 'all' - layout transitions are applied to all layout changes
 *   (items order change and position change caused by addition or removal
 *   of items)
 * - 'reorder' - layout transitions are only applied when items are reordered
 */
export type ItemsLayoutTransitionMode = 'all' | 'reorder';

export type ItemLayoutAnimationSettings = {
  /** Animation to play when an item enters the list */
  itemEntering: LayoutAnimation | null;
  /** Animation to play when an item exits the list */
  itemExiting: LayoutAnimation | null;
  /** Animation to play when items are reordered */
  itemsLayout: LayoutTransition | null;
  /** Controls when layout transitions are applied */
  itemsLayoutTransitionMode: ItemsLayoutTransitionMode;
};

/** Parameters provided when an item starts being dragged */
export type DragStartParams = {
  /** Unique identifier of the dragged item */
  key: string;
  /** Original index of the dragged item */
  fromIndex: number;
  /** Array mapping indices to item keys */
  indexToKey: Array<string>;
  /** Object mapping item keys to their indices */
  keyToIndex: Record<string, number>;
};

/** Parameters provided when an item is being dragged. */
export type DragMoveParams = {
  /** Unique identifier of the dragged item */
  key: string;
  /** Original index of the dragged item */
  fromIndex: number;
  /** Touch data */
  touchData: TouchData;
};

/** Parameters provided when drag gesture completes and item is dropped */
export type DragEndParams = {
  /** Unique identifier of the dragged item */
  key: string;
  /** Original index of the dragged item */
  fromIndex: number;
  /** Final index where the item was dropped */
  toIndex: number;
  /** Array mapping indices to item keys */
  indexToKey: Array<string>;
  /** Object mapping item keys to their indices */
  keyToIndex: Record<string, number>;
};

/** Parameters provided when items change their positions during dragging. */
export type OrderChangeParams = {
  /** Unique identifier of the moved item */
  key: string;
  /** Previous index of the moved item */
  fromIndex: number;
  /** New index of the moved item */
  toIndex: number;
  /** Array mapping indices to item keys */
  indexToKey: Array<string>;
  /** Object mapping item keys to their indices */
  keyToIndex: Record<string, number>;
};

/** Parameters provided when the active item is dropped */
export type ActiveItemDroppedParams = DragEndParams;

/**
 * Callback function called when the item drag starts
 * @param params - Parameters for the drag start event
 */
export type DragStartCallback = (params: DragStartParams) => void;

/**
 * Callback function called when the item is being dragged
 * @param params - Parameters for the drag move event
 */
export type DragMoveCallback = (params: DragMoveParams) => void;

/**
 * Callback function called when the item drag ends
 * @param params - Parameters for the drag end event
 */
export type DragEndCallback = (params: DragEndParams) => void;

/**
 * Callback function called when the items order changes
 * @param params - Parameters for the order change event
 */
export type OrderChangeCallback = (params: OrderChangeParams) => void;

/**
 * Callback function called when the active item is dropped
 * @param params - Parameters for the active item dropped event
 */
export type ActiveItemDroppedCallback = (
  params: ActiveItemDroppedParams
) => void;

export type SortableCallbacks = {
  /** Called when an item starts being dragged
   * @param params Parameters for the drag start event
   */
  onDragStart?: DragStartCallback;

  /** Called multiple times during dragging when an item is being dragged.
   * @param params Parameters for the drag move event
   */
  onDragMove?: DragMoveCallback;

  /** Called once when the drag gesture ends.
   * You can use this callback to update items order in state.
   * @param params Parameters for the drag end event
   */
  onDragEnd?: DragEndCallback;

  /** Called multiple times during dragging when items positions are swapped.
   * @param params Parameters for the order change event
   * @warning Don't use this callback to update items order in state because
   * it's called frequently during dragging. Use `onDragEnd` instead.
   */
  onOrderChange?: OrderChangeCallback;

  /** Called once when the active item is dropped.
   * @param params Parameters for the active item dropped event
   */
  onActiveItemDropped?: ActiveItemDroppedCallback;
};

export type Overflow = 'hidden' | 'visible';

export type DimensionsAnimation = 'layout' | 'none' | 'worklet';

export type SharedProps = Simplify<
  Omit<SortableCallbacks, 'onDragEnd'> &
    Partial<
      ActiveItemDecorationSettings &
        ActiveItemSnapSettings &
        AutoScrollSettings &
        DropIndicatorSettings &
        ItemDragSettings &
        ItemLayoutAnimationSettings & {
          /** Whether and how to animate container dimensions changes */
          dimensionsAnimationType: DimensionsAnimation;
          /** Enable haptic feedback when sorting items */
          hapticsEnabled: boolean;
          /** Controls whether sorting functionality is enabled */
          sortEnabled: Animatable<boolean>;
          /** Whether to use a custom handle component for dragging */
          customHandle: boolean;
          /** Specifies how content overflowing the container should be handled */
          overflow: Overflow;
          /** Enables debug mode to show additional visual helpers and console logs.
           * @note This only works in development builds and has no effect in production.
           */
          debug: boolean;
        }
    >
>;
