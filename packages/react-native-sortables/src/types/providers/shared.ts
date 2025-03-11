import type { ReactNode } from 'react';
import type { LayoutChangeEvent, View, ViewStyle } from 'react-native';
import type { GestureTouchEvent } from 'react-native-gesture-handler';
import type {
  AnimatedRef,
  AnimatedStyle,
  SharedValue
} from 'react-native-reanimated';

import type {
  DebugCrossUpdater,
  DebugLineUpdater,
  DebugRectUpdater,
  DebugViews
} from '../debug';
import type { Dimensions, Vector } from '../layout/shared';
import type {
  ActiveItemDecorationSettings,
  ActiveItemSnapSettings,
  ItemDragSettings,
  ReorderTriggerOrigin
} from '../props/shared';
import type { DragActivationState } from '../state';
import type { AnimatedValues, AnyRecord, Maybe } from '../utils';

// COMMON VALUES

export type ControlledContainerDimensions = { width: boolean; height: boolean };

/**
 * Context values shared between all providers.
 * (they are stored in a single context to make the access to them easier
 * between different providers)
 */
export type CommonValuesContextType = {
  // ORDER
  indexToKey: SharedValue<Array<string>>;
  keyToIndex: SharedValue<Record<string, number>>;

  // POSITIONS
  itemPositions: SharedValue<Record<string, Vector>>;
  touchPosition: SharedValue<Vector | null>;
  activeItemPosition: SharedValue<Vector | null>;
  snapItemOffset: SharedValue<Vector | null>;

  // DIMENSIONS
  controlledContainerDimensions: SharedValue<ControlledContainerDimensions>;
  measuredContainerWidth: SharedValue<null | number>;
  measuredContainerHeight: SharedValue<null | number>;
  containerWidth: SharedValue<null | number>;
  containerHeight: SharedValue<null | number>;
  snapItemDimensions: SharedValue<Dimensions | null>;
  activeItemDimensions: SharedValue<Dimensions | null>;
  itemDimensions: SharedValue<Record<string, Dimensions>>;
  itemsStyleOverride: SharedValue<Maybe<ViewStyle>>;

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
  canSwitchToAbsoluteLayout: SharedValue<boolean>;
  shouldAnimateLayout: SharedValue<boolean>; // used only on web
  animateLayoutOnReorderOnly: SharedValue<boolean>;
  customHandle: boolean;

  itemsOverridesStyle: AnimatedStyle<ViewStyle>;
} & AnimatedValues<ActiveItemDecorationSettings> &
  AnimatedValues<ActiveItemSnapSettings> &
  AnimatedValues<Omit<ItemDragSettings, 'overDrag' | 'reorderTriggerOrigin'>>;

// MEASUREMENTS

export type MeasurementsContextType = {
  applyControlledContainerDimensions: (dimensions: Partial<Dimensions>) => void;
  handleItemMeasurement: (key: string, dimensions: Dimensions) => void;
  handleItemRemoval: (key: string) => void;
  measureContainer: () => void;
  setItemDimensionsAsSnapDimensions: (key: string) => void;
  handleHelperContainerMeasurement: (event: LayoutChangeEvent) => void;
};

// AUTO SCROLL

export type AutoScrollContextType = {
  scrollOffsetDiff: SharedValue<Vector | null>;
  updateStartScrollOffset: (providedOffset?: null | number) => void;
};

// DRAG

export type DragContextType = {
  handleTouchStart: (
    e: GestureTouchEvent,
    key: string,
    activationAnimationProgress: SharedValue<number>,
    activate: () => void,
    fail: () => void,
    handleRef: AnimatedRef<View> | undefined
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

export type ItemContextType = {
  itemKey: string;
  isActive: Readonly<SharedValue<boolean>>;
  dragActivationState: Readonly<SharedValue<DragActivationState>>;
  activationAnimationProgress: Readonly<SharedValue<number>>;
};

// LAYER

export enum LayerState {
  Focused = 2,
  Idle = 0,
  Intermediate = 1
}

export type LayerContextType = {
  updateLayer: (state: LayerState) => void;
};

// PORTAL

export type PortalSubscription = (isTeleported: boolean) => void;

export type PortalContextType = {
  activeItemAbsolutePosition: SharedValue<Vector | null>;
  portalOutletRef: AnimatedRef<View>;
  teleport: (itemKey: string, node: ReactNode) => void;
  subscribe: (itemKey: string, callback: PortalSubscription) => void;
  notifyRendered: (itemKey: string) => void;
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyStrategyFactory = (props: any) => OrderUpdater;

export type PredefinedStrategies = Record<string, AnyStrategyFactory>;

export type OrderUpdaterProps<
  P extends PredefinedStrategies = PredefinedStrategies
> = {
  predefinedStrategies: P;
  strategy: AnyStrategyFactory | keyof P;
  triggerOrigin: ReorderTriggerOrigin;
  useAdditionalValues: () => AnyRecord;
};
