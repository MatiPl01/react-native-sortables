import { type PropsWithChildren, useCallback, useEffect } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { StyleSheet } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
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
import type {
  Dimension,
  Dimensions,
  MeasurementsContextType
} from '../../types';
import type { AnimatedTimeoutID } from '../../utils';
import {
  areDimensionsDifferent,
  clearAnimatedTimeout,
  setAnimatedTimeout
} from '../../utils';
import { createProvider } from '../utils';
import { useCommonValuesContext } from './CommonValuesProvider';

export type MeasurementsProviderProps = PropsWithChildren<{
  itemsCount: number;
}>;

const { MeasurementsProvider, useMeasurementsContext } = createProvider(
  'Measurements'
)<MeasurementsProviderProps, MeasurementsContextType>(({
  children,
  itemsCount
}) => {
  const {
    activeItemDimensions,
    activeItemKey,
    canSwitchToAbsoluteLayout,
    containerHeight,
    containerRef,
    containerWidth,
    controlledContainerDimensions,
    customHandle,
    itemDimensions,
    measuredContainerDimensions,
    snapItemDimensions
  } = useCommonValuesContext();

  const measuredItemsCount = useSharedValue(0);
  const initialItemMeasurementsCompleted = useSharedValue(false);
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
      if (activeItemKey.value === key) {
        activeItemDimensions.value = dimensions;
        if (!customHandle) {
          snapItemDimensions.value = dimensions;
        }
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
  const setItemDimensionsAsSnapDimensions = useCallback(
    (key: string) => {
      'worklet';
      snapItemDimensions.value = itemDimensions.value[key] ?? null;
    },
    [itemDimensions, snapItemDimensions]
  );

  const applyControlledContainerDimensions = useCallback(
    (dimensions: Partial<Dimensions>) => {
      'worklet';
      // Reset container dimensions to the measured dimensions
      containerHeight.value = measuredContainerDimensions.value?.height ?? null;
      containerWidth.value = measuredContainerDimensions.value?.width ?? null;

      const update = (
        target: SharedValue<null | number>,
        dimension: Dimension
      ) => {
        target.value =
          dimensions[dimension] ??
          measuredContainerDimensions.value?.[dimension] ??
          null;
      };

      // Override controlled dimensions (dimensions that are applied based
      // on the sortable component layout calculations)
      if (controlledContainerDimensions.value.height) {
        update(containerHeight, 'height');
      }
      if (controlledContainerDimensions.value.width) {
        update(containerWidth, 'width');
      }
    },
    [
      containerHeight,
      containerWidth,
      controlledContainerDimensions,
      measuredContainerDimensions
    ]
  );

  const applyMeasuredContainerDimensions = useCallback(
    (dimensions: Dimensions) => {
      'worklet';
      if (
        measuredContainerDimensions.value === null ||
        areDimensionsDifferent(measuredContainerDimensions.value, dimensions)
      ) {
        measuredContainerDimensions.value = dimensions;
        if (!controlledContainerDimensions.value.height) {
          containerHeight.value = dimensions.height;
        }
        if (!controlledContainerDimensions.value.width) {
          containerWidth.value = dimensions.width;
        }
      }
    },
    [
      containerHeight,
      controlledContainerDimensions,
      measuredContainerDimensions
    ]
  );

  const handleHelperContainerMeasurement = useCallback(
    ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
      runOnUI(applyMeasuredContainerDimensions)(layout);
    },
    [applyMeasuredContainerDimensions]
  );

  const measureContainer = useCallback(() => {
    'worklet';
    const measurements = measure(containerRef);
    if (measurements) {
      applyMeasuredContainerDimensions(measurements);
    }
  }, [applyMeasuredContainerDimensions, containerRef]);

  useAnimatedReaction(
    () => ({
      containerH: containerHeight.value,
      containerW: containerWidth.value,
      itemMeasurementsCompleted: initialItemMeasurementsCompleted.value,
      measuredDimensions: measuredContainerDimensions.value
    }),
    ({
      containerH,
      containerW,
      itemMeasurementsCompleted,
      measuredDimensions
    }) => {
      if (!canSwitchToAbsoluteLayout.value) {
        canSwitchToAbsoluteLayout.value = !!(
          itemMeasurementsCompleted &&
          measuredDimensions &&
          (containerH === null ||
            Math.abs(measuredDimensions.height - containerH) < OFFSET_EPS) &&
          (containerW === null ||
            Math.abs(measuredDimensions.width - containerW) < OFFSET_EPS)
        );
      }
    }
  );

  const animatedContainerStyle = useAnimatedStyle(() => ({
    height: containerHeight.value,
    width: containerWidth.value
  }));

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
      applyControlledContainerDimensions,
      handleItemMeasurement,
      handleItemRemoval,
      measureContainer,
      setItemDimensionsAsSnapDimensions
    }
  };
});

const styles = StyleSheet.create({
  helperContainer: {
    left: 0,
    position: 'absolute',
    top: 0
  }
});

export { MeasurementsProvider, useMeasurementsContext };
