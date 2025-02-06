import { type PropsWithChildren, useCallback, useEffect } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { StyleSheet } from 'react-native';
import {
  measure,
  runOnUI,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated';

import AnimatedOnLayoutView from '../../components/shared/AnimatedOnLayoutView';
import { OFFSET_EPS } from '../../constants';
import { useUIStableCallback } from '../../hooks';
import type { Dimensions, MeasurementsContextType } from '../../types';
import type { AnimatedTimeoutID } from '../../utils';
import {
  areDimensionsDifferent,
  clearAnimatedTimeout,
  maybeUpdateValue,
  setAnimatedTimeout
} from '../../utils';
import { createProvider } from '../utils';
import { useCommonValuesContext } from './CommonValuesProvider';

type MeasurementsProviderProps = PropsWithChildren<{
  itemsCount: number;
  measureParent?: boolean;
}>;

const { MeasurementsProvider, useMeasurementsContext } = createProvider(
  'Measurements'
)<MeasurementsProviderProps, MeasurementsContextType>(({
  children,
  itemsCount
}) => {
  const {
    activeItemKey,
    canSwitchToAbsoluteLayout,
    containerHeight,
    containerRef,
    containerWidth,
    customHandle,
    itemDimensions,
    snapItemDimensions
  } = useCommonValuesContext();

  const measuredItemsCount = useSharedValue(0);
  const initialItemMeasurementsCompleted = useSharedValue(false);
  const containerHeightApplied = useSharedValue(false);
  const updateTimeoutId = useSharedValue<AnimatedTimeoutID>(-1);

  useEffect(() => {
    return () => {
      clearAnimatedTimeout(updateTimeoutId.value);
    };
  }, [updateTimeoutId]);

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
      if (!customHandle && activeItemKey.value === key) {
        snapItemDimensions.value = dimensions;
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

  /**
   * Updates the dimensions of the handle that is currently being touched
   * (only if there is no custom handle and the entire item is treated as a handle)
   */
  const maybeUpdateSnapDimensions = useCallback(
    (key: string) => {
      'worklet';
      const dimensions = itemDimensions.value[key] ?? null;
      snapItemDimensions.value = dimensions;
    },
    [itemDimensions, snapItemDimensions]
  );

  const checkMeasuredHeight = useCallback(
    (measuredHeight: number) => {
      'worklet';
      if (
        containerHeight.value !== -1 &&
        Math.abs(measuredHeight - containerHeight.value) < OFFSET_EPS
      ) {
        containerHeightApplied.value = true;
      }
    },
    [containerHeight, containerHeightApplied]
  );

  const handleHelperContainerMeasurement = useCallback(
    ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
      maybeUpdateValue(containerWidth, layout.width, OFFSET_EPS);
      runOnUI(checkMeasuredHeight)(layout.height);
    },
    [containerWidth, checkMeasuredHeight]
  );

  const tryMeasureContainerHeight = useCallback(() => {
    'worklet';
    const measurements = measure(containerRef);
    if (measurements) {
      checkMeasuredHeight(measurements.height);
    }
  }, [checkMeasuredHeight, containerRef]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    minHeight: containerHeight.value === -1 ? undefined : containerHeight.value
  }));

  useAnimatedReaction(
    () =>
      containerHeightApplied.value && initialItemMeasurementsCompleted.value,
    canSwitch => {
      canSwitchToAbsoluteLayout.value = canSwitch;
    }
  );

  return {
    children: (
      <>
        <AnimatedOnLayoutView
          ref={containerRef}
          style={[styles.helperContainer, animatedContainerStyle]}
          onLayout={handleHelperContainerMeasurement}
        />
        {children}
      </>
    ),
    value: {
      handleItemMeasurement,
      handleItemRemoval,
      maybeUpdateSnapDimensions,
      tryMeasureContainerHeight
    }
  };
});

const styles = StyleSheet.create({
  helperContainer: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0
  }
});

export { MeasurementsProvider, useMeasurementsContext };
