import { type PropsWithChildren, useCallback, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import Animated, {
  measure,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

import { OFFSET_EPS } from '../../constants';
import { useUIStableCallback } from '../../hooks';
import type { Dimensions } from '../../types';
import type { AnimatedIntervalID, AnimatedTimeoutID } from '../../utils';
import {
  areDimensionsDifferent,
  clearAnimatedInterval,
  clearAnimatedTimeout,
  maybeUpdateValue,
  setAnimatedInterval,
  setAnimatedTimeout
} from '../../utils';
import { createProvider } from '../utils';
import { useCommonValuesContext } from './CommonValuesProvider';

const MEASUREMENT_RETRY_INTERVAL = 100;
const MAX_MEASUREMENT_RETRIES = Math.floor(2000 / MEASUREMENT_RETRY_INTERVAL); // try to measure for 2 seconds

type MeasurementsContextType = {
  handleItemMeasurement: (key: string, dimensions: Dimensions) => void;
  handleItemRemoval: (key: string) => void;
  updateTouchedItemDimensions: (key: string) => void;
  tryMeasureContainerHeight: () => void;
};

type MeasurementsProviderProps = PropsWithChildren<{
  itemsCount: number;
}>;

const { MeasurementsProvider, useMeasurementsContext } = createProvider(
  'Measurements'
)<MeasurementsProviderProps, MeasurementsContextType>(({
  children,
  itemsCount
}) => {
  const {
    activeItemDropped,
    animateContainerHeight,
    canSwitchToAbsoluteLayout,
    containerHeight,
    containerRef,
    containerWidth,
    itemDimensions,
    targetContainerHeight,
    targetContainerWidth,
    touchedItemDimensions,
    touchedItemKey
  } = useCommonValuesContext();

  const measuredItemsCount = useSharedValue(0);
  const initialItemMeasurementsCompleted = useSharedValue(false);
  const updateTimeoutId = useSharedValue<AnimatedTimeoutID | null>(null);

  const helperContainerRef = useAnimatedRef<Animated.View>();
  const measurementIntervalId = useSharedValue<AnimatedIntervalID | null>(null);
  const measurementRetryCount = useSharedValue(0);

  useEffect(() => {
    return () => {
      clearAnimatedInterval(measurementIntervalId.value);
      clearAnimatedTimeout(updateTimeoutId.value);
    };
  }, [measurementIntervalId, updateTimeoutId]);

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
        touchedItemDimensions.value = dimensions;
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
          if (updateTimeoutId.value !== null) {
            clearAnimatedTimeout(updateTimeoutId.value);
          }
          updateTimeoutId.value = setAnimatedTimeout(() => {
            itemDimensions.value = { ...itemDimensions.value };
            updateTimeoutId.value = null;
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
      touchedItemDimensions.value = dimensions;
    },
    [itemDimensions, touchedItemDimensions]
  );

  const maybeSwitchToAbsoluteLayout = useCallback(
    (measuredHeight: number) => {
      'worklet';
      if (measuredHeight > 0 || measuredHeight === containerHeight.value) {
        clearAnimatedInterval(measurementIntervalId.value);
        canSwitchToAbsoluteLayout.value = true;
      }
    },
    [canSwitchToAbsoluteLayout, measurementIntervalId, containerHeight]
  );

  const tryMeasureContainerHeight = useCallback(() => {
    'worklet';
    measurementRetryCount.value = 0;
    clearAnimatedInterval(measurementIntervalId.value);
    measurementIntervalId.value = setAnimatedInterval(() => {
      const measuredHeight = measure(helperContainerRef)?.height ?? null;
      if (measuredHeight === null) {
        return;
      }
      maybeSwitchToAbsoluteLayout(measuredHeight);
      if (measurementRetryCount.value >= MAX_MEASUREMENT_RETRIES) {
        clearAnimatedInterval(measurementIntervalId.value);
      } else {
        measurementRetryCount.value += 1;
      }
    }, MEASUREMENT_RETRY_INTERVAL);
  }, [
    helperContainerRef,
    measurementIntervalId,
    measurementRetryCount,
    maybeSwitchToAbsoluteLayout
  ]);

  const handleHelperContainerHeightMeasurement = useUIStableCallback(
    (height: number) => {
      'worklet';
      maybeSwitchToAbsoluteLayout(height);
    }
  );

  // CONTAINER HEIGHT UPDATER
  useAnimatedReaction(
    () => ({
      animated: animateContainerHeight.value,
      targetHeight: targetContainerHeight.value,
      targetWidth: targetContainerWidth.value
    }),
    ({ animated, targetHeight, targetWidth }) => {
      const update = (
        animatedDimension: SharedValue<null | number>,
        target: null | number
      ) => {
        if (target !== null) {
          animatedDimension.value =
            !animated || animatedDimension.value === null
              ? targetHeight
              : withTiming(target);
        }
      };

      console.log('update', targetHeight, targetWidth);

      update(containerHeight, targetHeight);
      update(containerWidth, targetWidth);
    }
  );

  // Use this handler to measure the applied container height
  // (onLayout was very flaky, it was sometimes not called at all
  // after applying the animated style with the containerHeight to
  // the helper container)
  useAnimatedReaction(
    () => containerHeight.value,
    height => {
      if (height !== null && !canSwitchToAbsoluteLayout.value) {
        tryMeasureContainerHeight();
      }
    }
  );

  const animatedContainerStyle = useAnimatedStyle(() => ({
    height: containerHeight.value ?? undefined,
    overflow:
      touchedItemKey.value === null && activeItemDropped.value
        ? 'hidden'
        : 'visible'
  }));

  return {
    children: (
      <Animated.View
        ref={containerRef}
        style={[styles.container, animatedContainerStyle]}
        onLayout={({ nativeEvent: { layout } }) =>
          handleContainerWidthMeasurement(layout.width)
        }>
        {/* Helper component used to ensure that the calculated container height
        was reflected in layout and is applied to the container */}
        <Animated.View
          ref={helperContainerRef}
          style={[styles.helperContainer, animatedContainerStyle]}
          onLayout={({ nativeEvent: { layout } }) =>
            handleHelperContainerHeightMeasurement(layout.height)
          }
        />
        {children}
      </Animated.View>
    ),
    value: {
      handleItemMeasurement,
      handleItemRemoval,
      tryMeasureContainerHeight,
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
