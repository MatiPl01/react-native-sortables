import type { ViewStyle } from 'react-native';
import type { GestureTouchEvent } from 'react-native-gesture-handler';
import type { AnimatedRef, SharedValue } from 'react-native-reanimated';
import type Animated from 'react-native-reanimated';

import type {
  DebugCrossUpdater,
  DebugLineUpdater,
  DebugRectUpdater,
  DebugViews
} from '../debug';
import type { Dimensions, Vector } from '../layout/shared';
import type {
  ActiveItemDecorationSettings,
  ActiveItemSnapSettings
} from '../props/shared';
import type { DragActivationState } from '../state';
import type { AnimatedValues, AnyRecord, Maybe } from '../utils';

// COMMON VALUES

/**
 * Context values shared between all providers.
 * (they are stored in a single context to make the access to them easier
 * between different providers)
 */
export type CommonValuesContextType = {
  // ORDER
  indexToKey: SharedValue<Array<string>>;
  keyToIndex: SharedValue<Record<string, number>>;

  // POSITIONs
  itemPositions: SharedValue<Record<string, Vector>>;
  touchPosition: SharedValue<Vector | null>;
  touchedItemPosition: SharedValue<Vector | null>;

  // DIMENSIONS
  containerWidth: SharedValue<number>;
  containerHeight: SharedValue<number>;
  touchedItemWidth: SharedValue<number>;
  touchedItemHeight: SharedValue<number>;
  itemDimensions: SharedValue<Record<string, Dimensions>>;
  itemsStyleOverride: SharedValue<Maybe<ViewStyle>>;

  // DRAG STATE
  touchedItemKey: SharedValue<null | string>;
  activeItemKey: SharedValue<null | string>;
  activationState: SharedValue<DragActivationState>;
  activationProgress: SharedValue<number>;
  inactiveAnimationProgress: SharedValue<number>;
  activeItemDropped: SharedValue<boolean>;

  // OTHER
  containerRef: AnimatedRef<Animated.View>;
  sortEnabled: SharedValue<boolean>;
  canSwitchToAbsoluteLayout: SharedValue<boolean>;
} & AnimatedValues<ActiveItemDecorationSettings> &
  AnimatedValues<ActiveItemSnapSettings>;

// MEASUREMENTS

export type MeasurementsContextType = {
  handleItemMeasurement: (key: string, dimensions: Dimensions) => void;
  handleItemRemoval: (key: string) => void;
  tryMeasureContainerHeight: () => void;
  updateTouchedItemDimensions: (key: string) => void;
};

// AUTO SCROLL

export type AutoScrollContextType = {
  scrollOffset: SharedValue<number>;
  dragStartScrollOffset: SharedValue<number>;
  updateStartScrollOffset: (providedOffset?: number) => void;
};

// DRAG

export type DragContextType = {
  handleTouchStart: (
    e: GestureTouchEvent,
    key: string,
    pressProgress: SharedValue<number>,
    onActivate: () => void
  ) => void;
  handleTouchesMove: (e: GestureTouchEvent, onFail: () => void) => void;
  handleDragEnd: (key: string, pressProgress: SharedValue<number>) => void;
  handleOrderChange: (
    key: string,
    fromIndex: number,
    toIndex: number,
    newOrder: Array<string>
  ) => void;
};

// ITEM

export type ItemContextType = {
  position: {
    x: Readonly<SharedValue<null | number>>;
    y: Readonly<SharedValue<null | number>>;
  };
  pressProgress: Readonly<SharedValue<number>>;
  zIndex: Readonly<SharedValue<number>>;
  isBeingActivated: Readonly<SharedValue<boolean>>;
  dragActivationState: Readonly<SharedValue<DragActivationState>>;
};

// LAYER

export enum LayerState {
  Focused = 2,
  Idle = 0,
  Intermediate = 1
}

export type LayerProviderContextType = {
  updateLayer: (state: LayerState) => void;
};

// DEBUG

export type DebugProviderContextType = {
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
  useAdditionalValues: () => AnyRecord;
};
