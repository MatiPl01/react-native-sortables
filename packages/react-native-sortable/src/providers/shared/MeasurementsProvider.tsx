import { type PropsWithChildren, useCallback, useEffect } from 'react';
import type { LayoutRectangle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import Animated, {
  measure,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue
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
  measureParent?: boolean;
}>;

const { MeasurementsProvider, useMeasurementsContext } = createProvider(
  'Measurements'
)<MeasurementsProviderProps, MeasurementsContextType>(({
  children,
  itemsCount,
  measureParent
}) => {
  const {
    activatedItemKey,
    activeItemDropped,
    canSwitchToAbsoluteLayout,
    containerHeight,
    containerRef,
    containerWidth,
    itemDimensions,
    parentDimensions,
    touchedItemHeight,
    touchedItemWidth
  } = useCommonValuesContext();

  const measuredItemsCount = useSharedValue(0);
  const initialItemMeasurementsCompleted = useSharedValue(false);
  const updateTimeoutId = useSharedValue<AnimatedTimeoutID>(-1);

  const helperContainerRef = useAnimatedRef<Animated.View>();
  const measurementIntervalId = useSharedValue<AnimatedIntervalID>(-1);
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
      if (activatedItemKey.value === key) {
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

  const updateTouchedItemDimensions = useCallback(
    (key: string) => {
      'worklet';
      const dimensions = itemDimensions.value[key] ?? null;
      touchedItemWidth.value = dimensions?.width ?? -1;
      touchedItemHeight.value = dimensions?.height ?? -1;
    },
    [itemDimensions, touchedItemHeight, touchedItemWidth]
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
      const measuredHeight = measure(helperContainerRef)?.height ?? -1;
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

  const handleParentMeasurement = useCallback(
    (layout: LayoutRectangle) => {
      parentDimensions.value = {
        height: layout.height,
        width: layout.width
      };
    },
    [parentDimensions]
  );

  const handleContainerWidthMeasurement = useCallback(
    (width: number) => {
      maybeUpdateValue(containerWidth, width, OFFSET_EPS);
    },
    [containerWidth]
  );

  const handleHelperContainerHeightMeasurement = useCallback(
    (height: number) => {
      maybeSwitchToAbsoluteLayout(height);
    },
    [maybeSwitchToAbsoluteLayout]
  );

  // Use this handler to measure the applied container height
  // (onLayout was very flaky, it was sometimes not called at all
  // after applying the animated style with the containerHeight to
  // the helper container)
  useAnimatedReaction(
    () => containerHeight.value,
    height => {
      if (height !== -1 && !canSwitchToAbsoluteLayout.value) {
        tryMeasureContainerHeight();
      }
    }
  );

  const animatedContainerStyle = useAnimatedStyle(() => ({
    // Use minHeight instead of height in order not to limit the height
    // of grid items (e.g. when it is calculated via the aspect ratio)
    minHeight: containerHeight.value === -1 ? undefined : containerHeight.value,
    overflow:
      activatedItemKey.value !== null || !activeItemDropped.value
        ? 'visible'
        : 'hidden'
  }));

  return {
    children: (
      <>
        {measureParent && (
          <View
            style={styles.container}
            onLayout={({ nativeEvent: { layout } }) =>
              handleParentMeasurement(layout)
            }
          />
        )}
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
      </>
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
