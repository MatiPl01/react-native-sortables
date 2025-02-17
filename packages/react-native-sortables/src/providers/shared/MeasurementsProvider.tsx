import { useCallback, useEffect } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import {
  measure,
  runOnUI,
  useAnimatedReaction,
  useSharedValue
} from 'react-native-reanimated';

import { OFFSET_EPS } from '../../constants';
import { useUIStableCallback } from '../../hooks';
import type { Dimensions, MeasurementsContextType } from '../../types';
import type { AnimatedTimeoutID } from '../../utils';
import {
  areDimensionsDifferent,
  clearAnimatedTimeout,
  setAnimatedTimeout
} from '../../utils';
import { createProvider } from '../utils';
import { useCommonValuesContext } from './CommonValuesProvider';

export type MeasurementsProviderProps = {
  itemsCount: number;
};

const { MeasurementsProvider, useMeasurementsContext } = createProvider(
  'Measurements'
)<MeasurementsProviderProps, MeasurementsContextType>(({ itemsCount }) => {
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
    measuredContainerHeight,
    measuredContainerWidth,
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
      containerHeight.value = measuredContainerHeight.value ?? null;
      containerWidth.value = measuredContainerWidth.value ?? null;

      // Override controlled dimensions (dimensions that are applied based
      // on the sortable component layout calculations)
      if (
        controlledContainerDimensions.value.height &&
        dimensions.height !== undefined
      ) {
        containerHeight.value = dimensions.height;
      }
      if (
        controlledContainerDimensions.value.width &&
        dimensions.width !== undefined
      ) {
        containerWidth.value = dimensions.width;
      }
    },
    [
      containerHeight,
      containerWidth,
      controlledContainerDimensions,
      measuredContainerHeight,
      measuredContainerWidth
    ]
  );

  const applyMeasuredContainerDimensions = useCallback(
    (dimensions: Dimensions) => {
      'worklet';
      measuredContainerHeight.value = dimensions.height;
      measuredContainerWidth.value = dimensions.width;

      if (canSwitchToAbsoluteLayout.value) {
        if (!controlledContainerDimensions.value.height) {
          containerHeight.value = dimensions.height;
        }
        if (!controlledContainerDimensions.value.width) {
          containerWidth.value = dimensions.width;
        }
      }
    },
    [
      canSwitchToAbsoluteLayout,
      containerHeight,
      containerWidth,
      controlledContainerDimensions,
      measuredContainerHeight,
      measuredContainerWidth
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
      measuredHeight: measuredContainerHeight.value,
      measuredWidth: measuredContainerWidth.value
    }),
    ({
      containerH,
      containerW,
      itemMeasurementsCompleted,
      measuredHeight,
      measuredWidth
    }) => {
      if (
        canSwitchToAbsoluteLayout.value ||
        !itemMeasurementsCompleted ||
        measuredHeight === null ||
        measuredWidth === null ||
        (containerH === null && containerW === null) ||
        (containerH !== null &&
          Math.abs(measuredHeight - containerH) > OFFSET_EPS) ||
        (containerW !== null &&
          Math.abs(measuredWidth - containerW) > OFFSET_EPS)
      ) {
        return;
      }

      canSwitchToAbsoluteLayout.value = true;
    }
  );

  return {
    value: {
      applyControlledContainerDimensions,
      handleHelperContainerMeasurement,
      handleItemMeasurement,
      handleItemRemoval,
      measureContainer,
      setItemDimensionsAsSnapDimensions
    }
  };
});

export { MeasurementsProvider, useMeasurementsContext };
