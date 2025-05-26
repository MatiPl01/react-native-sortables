import type { ReactNode } from 'react';
import type { LayoutChangeEvent, View, ViewStyle } from 'react-native';
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
import type {
  AbsoluteLayoutState,
  DragActivationState,
  LayerState
} from '../state';
import type { AnimatedValues, AnyRecord, DeepReadonly, Maybe } from '../utils';

// COMMON VALUES

export type ControlledContainerDimensions = { width: boolean; height: boolean };

// ACTIVE ITEM VALUES

export type ActiveItemValuesContextType = {
  // POSITIONS
  touchPosition: SharedValue<Vector | null>;
  activeItemPosition: SharedValue<Vector | null>;

  // DIMENSIONS
  activeItemDimensions: SharedValue<Dimensions | null>;

  // DRAG STATE
  prevActiveItemKey: SharedValue<null | string>;
  activeItemKey: SharedValue<null | string>;
  activationState: SharedValue<DragActivationState>;
  activeAnimationProgress: SharedValue<number>;
  inactiveAnimationProgress: SharedValue<number>;
  activeItemDropped: SharedValue<boolean>;
};

// COMMON VALUES

/**
 * Context values shared between all providers.
 * (they are stored in a single context to make the access to them easier
 * between different providers)
 */
export type CommonValuesContextType = {
  componentId: number;

  // ORDER
  indexToKey: SharedValue<Array<string>>;
  keyToIndex: SharedValue<Record<string, number>>;

  // POSITIONS
  itemPositions: SharedValue<Record<string, Vector>>;

  // DIMENSIONS
  controlledContainerDimensions: SharedValue<ControlledContainerDimensions>;
  measuredContainerWidth: SharedValue<null | number>;
  measuredContainerHeight: SharedValue<null | number>;
  containerWidth: SharedValue<null | number>;
  containerHeight: SharedValue<null | number>;
  itemDimensions: SharedValue<Record<string, Dimensions>>;
  itemsStyleOverride: SharedValue<Maybe<ViewStyle>>;

  // OTHER
  containerRef: AnimatedRef<View>;
  sortEnabled: SharedValue<boolean>;
  absoluteLayoutState: SharedValue<AbsoluteLayoutState>;
  shouldAnimateLayout: SharedValue<boolean>; // used only on web
  animateLayoutOnReorderOnly: SharedValue<boolean>;
  customHandle: boolean;

  itemsOverridesStyle: AnimatedStyle<ViewStyle>;
} & ActiveItemValuesContextType &
  AnimatedValues<ActiveItemDecorationSettings> &
  AnimatedValues<ActiveItemSnapSettings> &
  AnimatedValues<Omit<ItemDragSettings, 'overDrag' | 'reorderTriggerOrigin'>>;

// MEASUREMENTS

export type MeasurementsContextType = {
  measurementsContainerRef: AnimatedRef<View>;
  applyControlledContainerDimensions: (dimensions: Partial<Dimensions>) => void;
  handleItemMeasurement: (key: string, dimensions: Dimensions) => void;
  removeItemMeasurements: (key: string) => void;
  measureContainer: () => void;
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

export type ItemContextType = {
  gesture: GestureType;
} & DeepReadonly<
  {
    itemKey: string;
    isActive: SharedValue<boolean>;
    activationAnimationProgress: SharedValue<number>;
  } & Pick<
    ActiveItemValuesContextType,
    'activationState' | 'activeItemKey' | 'prevActiveItemKey'
  > &
    Pick<CommonValuesContextType, 'indexToKey' | 'keyToIndex'>
>;

// LAYER

export type LayerContextType = {
  updateLayer: (state: LayerState) => void;
};

// CUSTOM HANDLE

export type CustomHandleContextType = {
  fixedItemKeys: SharedValue<Record<string, boolean>>;
  activeHandleMeasurements: SharedValue<MeasuredDimensions | null>;
  activeHandleOffset: SharedValue<Vector | null>;
  registerHandle: (
    key: string,
    handleRef: AnimatedRef<View>,
    fixed: boolean
  ) => () => void;
  updateActiveHandleMeasurements: (key: string) => void;
};

// PORTAL

export type PortalSubscription = (isTeleported: boolean) => void;

export type PortalContextType = {
  activeItemAbsolutePosition: SharedValue<Vector | null>;
  teleport: (id: string, node: ReactNode) => void;
  subscribe: (id: string, callback: PortalSubscription) => () => void;
  notifyRendered: (id: string) => void;
};

// PORTAL OUTLET

export type PortalOutletContextType = {
  portalOutletRef: AnimatedRef<View>;
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
