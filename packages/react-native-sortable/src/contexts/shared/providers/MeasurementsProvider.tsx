import { type PropsWithChildren, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  measure,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated';

import { OFFSET_EPS } from '../../../constants';
import { useUIStableCallback } from '../../../hooks';
import type { Dimensions } from '../../../types';
import type { AnimatedIntervalID, AnimatedTimeoutID } from '../../../utils';
import {
  areDimensionsDifferent,
  clearAnimatedInterval,
  clearAnimatedTimeout,
  maybeUpdateValue,
  setAnimatedInterval,
  setAnimatedTimeout
} from '../../../utils';
import { createEnhancedContext } from '../../utils';
import { useDragContext } from './DragProvider';

type MeasurementsContextType = {
  itemDimensions: SharedValue<Record<string, Dimensions>>;
  touchedItemWidth: SharedValue<number>;
  touchedItemHeight: SharedValue<number>;
  overrideItemDimensions: SharedValue<Record<string, Partial<Dimensions>>>;
  containerHeight: SharedValue<number>;
  containerWidth: SharedValue<number>;
  canSwitchToAbsoluteLayout: SharedValue<boolean>;
  handleItemMeasurement: (key: string, dimensions: Dimensions) => void;
  handleItemRemoval: (key: string) => void;
  updateTouchedItemDimensions: (key: string) => void;
};

type MeasurementsProviderProps = PropsWithChildren<{
  itemsCount: number;
}>;

const { MeasurementsProvider, useMeasurementsContext } = createEnhancedContext(
  'Measurements'
)<MeasurementsContextType, MeasurementsProviderProps>(({
  children,
  itemsCount
}) => {
  const { touchedItemKey } = useDragContext();

  const measuredItemsCount = useSharedValue(0);
  const initialItemMeasurementsCompleted = useSharedValue(false);
  const updateTimeoutId = useSharedValue<AnimatedTimeoutID>(-1);

  const helperContainerRef = useAnimatedRef<Animated.View>();
  const measurementIntervalId = useSharedValue<AnimatedIntervalID>(-1);

  const touchedItemWidth = useSharedValue<number>(-1);
  const touchedItemHeight = useSharedValue<number>(-1);
  const itemDimensions = useSharedValue<Record<string, Dimensions>>({});
  const overrideItemDimensions = useSharedValue<
    Record<string, Partial<Dimensions>>
  >({});
  const containerWidth = useSharedValue(-1);
  const containerHeight = useSharedValue(-1);
  const canSwitchToAbsoluteLayout = useSharedValue(false);

  // Use this handler to measure the applied container height
  // (onLayout was very flaky, it was sometimes not called at all
  // after applying the animated style with the containerHeight to
  // the helper container)
  useAnimatedReaction(
    () => containerHeight.value,
    height => {
      if (height !== -1 && !canSwitchToAbsoluteLayout.value) {
        // Start the measurement interval only after the containerHeight
        // is set for the first time
        measurementIntervalId.value = setAnimatedInterval(() => {
          const measuredHeight = measure(helperContainerRef)?.height ?? -1;
          if (measuredHeight > 0) {
            canSwitchToAbsoluteLayout.value = true;
            clearAnimatedInterval(measurementIntervalId.value);
          }
        }, 10);
      }
    }
  );

  const handleItemMeasurement = useUIStableCallback(
    (key: string, dimensions: Dimensions) => {
      'worklet';
      const storedDimensions = itemDimensions.value[key];

      if (
        storedDimensions &&
        !areDimensionsDifferent(storedDimensions, dimensions, 0.1)
      ) {
        return;
      }

      if (!itemDimensions.value[key]) {
        measuredItemsCount.value += 1;
      }

      itemDimensions.value[key] = dimensions;
      if (touchedItemKey.value === key) {
        touchedItemWidth.value = dimensions.width;
        touchedItemHeight.value = dimensions.height;
      }

      // Update the array of item dimensions only after all items have been
      // measured to reduce the number of times animated reactions are triggered
      if (measuredItemsCount.value === itemsCount) {
        // If this is the first time all items have been measured, update
        // dimensions immediately to avoid unnecessary delays
        if (!initialItemMeasurementsCompleted.value) {
          initialItemMeasurementsCompleted.value = true;
          itemDimensions.value = { ...itemDimensions.value };
        } else {
          // In all other cases, debounce the update in case multiple items
          // change their size at the same time
          if (updateTimeoutId.value !== -1) {
            clearAnimatedTimeout(updateTimeoutId.value);
          }
          updateTimeoutId.value = setAnimatedTimeout(() => {
            itemDimensions.value = { ...itemDimensions.value };
            updateTimeoutId.value = -1;
          }, 100);
        }
      }
    }
  );

  const handleItemRemoval = useUIStableCallback((key: string) => {
    'worklet';
    delete itemDimensions.value[key];
    measuredItemsCount.value = Math.max(0, measuredItemsCount.value - 1);
  });

  const handleContainerWidthMeasurement = useUIStableCallback(
    (width: number) => {
      'worklet';
      maybeUpdateValue(containerWidth, width, OFFSET_EPS);
    }
  );

  const updateTouchedItemDimensions = useCallback(
    (key: string) => {
      'worklet';
      const dimensions = itemDimensions.value[key] ?? null;
      touchedItemWidth.value = dimensions?.width ?? -1;
      touchedItemHeight.value = dimensions?.height ?? -1;
    },
    [itemDimensions, touchedItemWidth, touchedItemHeight]
  );

  const animatedContainerStyle = useAnimatedStyle(() => ({
    height: containerHeight.value === -1 ? undefined : containerHeight.value
  }));

  return {
    children: (
      <Animated.View
        style={[
          styles.container,
          animatedContainerStyle,
          { backgroundColor: 'red' }
        ]}
        onLayout={({ nativeEvent: { layout } }) =>
          handleContainerWidthMeasurement(layout.width)
        }>
        {/* Helper component used to ensure that the calculated container height
        was reflected in the calculated layout and applied to the container */}
        <Animated.View
          ref={helperContainerRef}
          style={[styles.helperContainer, animatedContainerStyle]}
        />
        {children}
      </Animated.View>
    ),
    value: {
      canSwitchToAbsoluteLayout,
      containerHeight,
      containerWidth,
      handleItemMeasurement,
      handleItemRemoval,
      itemDimensions,
      overrideItemDimensions,
      touchedItemHeight,
      touchedItemWidth,
      updateTouchedItemDimensions
    }
  };
});

const styles = StyleSheet.create({
  container: {
    width: '100%'
  },
  helperContainer: {
    position: 'absolute'
  }
});

export { MeasurementsProvider, useMeasurementsContext };
