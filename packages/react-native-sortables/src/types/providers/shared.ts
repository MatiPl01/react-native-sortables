import type { ReactNode } from 'react';
import type { ScrollView, View, ViewStyle } from 'react-native';
import type {
  GestureTouchEvent,
  GestureType
} from 'react-native-gesture-handler';
import type {
  AnimatedRef,
  AnimatedStyle,
  MeasuredDimensions,
  SharedValue
} from 'react-native-reanimated';

import type { DeepReadonly, Maybe, Simplify } from '../../helperTypes';
import type { AnimatedValues } from '../../integrations/reanimated';
import type {
  DebugCrossUpdater,
  DebugLineUpdater,
  DebugRectUpdater,
  DebugViews
} from '../debug';
import type { Dimensions, ItemSizes, Vector } from '../layout/shared';
import type {
  ActiveItemDecorationSettings,
  ActiveItemSnapSettings,
  ItemDragSettings,
  ReorderTriggerOrigin
} from '../props/shared';
import type { DragActivationState, LayerState } from '../state';

// ITEMS

export type RenderItemInfo<I> = {
  /** The item to render */
  item: I;
  /** Index of the item in the data array */
  index: number;
};

export type RenderItem<I> = (info: RenderItemInfo<I>) => ReactNode;

export type ItemsContextType = {
  getKeys: () => Array<string>;
  subscribeKeys: (callback: () => void) => () => void;
  getNode: (key: string) => ReactNode | undefined;
  subscribeItem: (key: string, callback: () => void) => () => void;
  subscribeItems: (
    callback: (updatedItemKeys: Array<string>) => void
  ) => () => void;
};

// COMMON VALUES

export type ControlledDimensions = { width: boolean; height: boolean };

/**
 * Context values shared between all providers.
 * (they are stored in a single context to make the access to them easier
 * between different providers)
 */
export type CommonValuesContextType =
  AnimatedValues<ActiveItemDecorationSettings> &
    AnimatedValues<ActiveItemSnapSettings> &
    AnimatedValues<
      Omit<ItemDragSettings, 'overDrag' | 'reorderTriggerOrigin'>
    > & {
      containerId: number;

      // ORDER
      indexToKey: SharedValue<Array<string>>;
      keyToIndex: SharedValue<Record<string, number>>;

      // POSITIONS
      touchPosition: SharedValue<null | Vector>;
      activeItemPosition: SharedValue<null | Vector>;
      itemPositions: SharedValue<Record<string, Vector>>;

      // DIMENSIONS
      controlledContainerDimensions: ControlledDimensions;
      controlledItemDimensions: ControlledDimensions;
      containerWidth: SharedValue<null | number>;
      containerHeight: SharedValue<null | number>;
      itemWidths: SharedValue<ItemSizes>;
      itemHeights: SharedValue<ItemSizes>;
      activeItemDimensions: SharedValue<Dimensions | null>;
      controlledItemDimensionsStyle: AnimatedStyle<ViewStyle>;

      // DRAG STATE
      prevActiveItemKey: SharedValue<null | string>;
      activeItemKey: SharedValue<null | string>;
      activationState: SharedValue<DragActivationState>;
      activeAnimationProgress: SharedValue<number>;
      inactiveAnimationProgress: SharedValue<number>;
      activeItemDropped: SharedValue<boolean>;

      // OTHER
      containerRef: AnimatedRef<View>;
      sortEnabled: SharedValue<boolean>;
      usesAbsoluteLayout: SharedValue<boolean>;
      shouldAnimateLayout: SharedValue<boolean>; // is set to false on web when the browser window is resized
      animateLayoutOnReorderOnly: SharedValue<boolean>;
      customHandle: boolean;
    };

// MEASUREMENTS

export type MeasurementsContextType = {
  updateItemRef: (key: string, instance: null | View) => void;
  handleContainerMeasurement: (width: number, height: number) => void;
  applyControlledContainerDimensions: (dimensions: Partial<Dimensions>) => void;
};

// AUTO SCROLL

export type AutoScrollContextType = {
  scrollableRef: AnimatedRef<ScrollView>;
  scrollOffsetDiff: SharedValue<number>;
  isVerticalScroll: boolean;
  contentBounds: SharedValue<[Vector, Vector] | null>;
  scrollBy: (distance: number, animated: boolean) => void;
};

// DRAG

export type DragContextType = {
  triggerOriginPosition: SharedValue<null | Vector>;
  handleTouchStart: (
    e: GestureTouchEvent,
    key: string,
    activationAnimationProgress: SharedValue<number>,
    activate: () => void,
    fail: () => void
  ) => void;
  handleTouchesMove: (e: GestureTouchEvent, fail: () => void) => void;
  handleDragEnd: (
    key: string,
    activationAnimationProgress: SharedValue<number>
  ) => void;
  handleOrderChange: (
    key: string,
    fromIndex: number,
    toIndex: number,
    newOrder: Array<string>
  ) => void;
};

// ITEM

export type ItemContextType = Simplify<
  DeepReadonly<
    Pick<
      CommonValuesContextType,
      'activationState' | 'activeItemKey' | 'prevActiveItemKey'
    > &
      Pick<CommonValuesContextType, 'indexToKey' | 'keyToIndex'> & {
        itemKey: string;
        isActive: SharedValue<boolean>;
        activationAnimationProgress: SharedValue<number>;
      }
  > & {
    gesture: GestureType;
  }
>;

// LAYER

export type LayerContextType = {
  updateLayer: (state: LayerState) => void;
};

// CUSTOM HANDLE

export type CustomHandleContextType = {
  fixedItemKeys: SharedValue<Record<string, boolean>>;
  activeHandleMeasurements: SharedValue<MeasuredDimensions | null>;
  activeHandleOffset: SharedValue<null | Vector>;
  registerHandle: (
    key: string,
    handleRef: AnimatedRef<View>,
    fixed: boolean
  ) => () => void;
  updateActiveHandleMeasurements: (key: string) => void;
};

// PORTAL

export type PortalContextType = {
  activeItemAbsolutePosition: SharedValue<null | Vector>;
  portalOutletMeasurements: SharedValue<MeasuredDimensions | null>;
  measurePortalOutlet: () => void;
  teleport: (id: string, node: ReactNode) => void;
  isTeleported: (id: string) => boolean;
};

// MULTI ZONE

export type MultiZoneContextType = {
  activeContainerId: SharedValue<null | number>;
  activeItemDimensions: SharedValue<Dimensions | null>;
};

// DEBUG

export type DebugContextType = {
  // Overloaded signatures for useDebugLines
  useDebugLines<K extends string>(keys: Array<K>): Record<K, DebugLineUpdater>;
  useDebugLines(count: number): Array<DebugLineUpdater>;

  // Overloaded signatures for useDebugRects
  useDebugRects<K extends string>(keys: Array<K>): Record<K, DebugRectUpdater>;
  useDebugRects(count: number): Array<DebugRectUpdater>;

  useDebugLine: () => DebugLineUpdater;
  useDebugRect: () => DebugRectUpdater;
  useDebugCross: () => DebugCrossUpdater;
  useObserver: (observer: (views: DebugViews) => void) => void;

  debugOutletRef: AnimatedRef<View>;
};

// ORDER UPDATER

type OrderUpdaterCallbackProps = {
  activeKey: string;
  activeIndex: number;
  dimensions: Dimensions;
  position: Vector;
};

export type OrderUpdater = (
  params: OrderUpdaterCallbackProps
) => Maybe<Array<string>>;

/**
 * Factory function that creates custom sort strategies.
 *
 * Building a custom sort strategy requires the usage of internal contexts.
 * These contexts are exported from the library and can be used in a similar
 * way to how predefined strategies are built within the library.
 *
 * **IMPORTANT**: This function must be a hook since it needs to access internal contexts.
 *
 * @returns An OrderUpdater function that determines the new order of items
 */
export type SortStrategyFactory = () => OrderUpdater;

export type PredefinedStrategies = Record<string, SortStrategyFactory>;

export type OrderUpdaterProps<
  P extends PredefinedStrategies = PredefinedStrategies
> = {
  predefinedStrategies: P;
  strategy: keyof P | SortStrategyFactory;
  triggerOrigin: ReorderTriggerOrigin;
};
