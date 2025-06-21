import { useCallback } from 'react';
import type { LayoutChangeEvent, View } from 'react-native';
import {
  measure,
  runOnUI,
  useAnimatedReaction,
  useAnimatedRef
} from 'react-native-reanimated';

import { OFFSET_EPS } from '../../constants';
import { useUIStableCallback } from '../../hooks';
import { type Dimensions, type MeasurementsContextType } from '../../types';
import {
  areDimensionsDifferent,
  useAnimatedDebounce,
  useMutableValue
} from '../../utils';
import { createProvider } from '../utils';
import { useCommonValuesContext } from './CommonValuesProvider';

type MeasurementsProviderProps = {
  itemsCount: number;
};

const { MeasurementsProvider, useMeasurementsContext } = createProvider(
  'Measurements'
)<MeasurementsProviderProps, MeasurementsContextType>(({ itemsCount }) => {
  const {
    activeItemDimensions,
    activeItemKey,
    containerHeight,
    containerWidth,
    controlledContainerDimensions,
    itemDimensions,
    measuredContainerHeight,
    measuredContainerWidth,
    usesAbsoluteLayout
  } = useCommonValuesContext();

  const measurementsContainerRef = useAnimatedRef<View>();
  const measuredItemsCount = useMutableValue(0);
  const initialItemMeasurementsCompleted = useMutableValue(false);
  const debounce = useAnimatedDebounce();

  const handleItemMeasurement = useUIStableCallback(
    (key: string, dimensions: Dimensions) => {
      'worklet';
      const storedDimensions = itemDimensions.value[key];

      if (
        storedDimensions &&
        !areDimensionsDifferent(storedDimensions, dimensions, 1)
      ) {
        return;
      }

      if (!itemDimensions.value[key]) {
        measuredItemsCount.value += 1;
      }

      itemDimensions.value[key] = dimensions;
      if (activeItemKey.value === key) {
        activeItemDimensions.value = dimensions;
      }

      // Update the array of item dimensions only after all items have been
      // measured to reduce the number of times animated reactions are triggered
      if (measuredItemsCount.value === itemsCount) {
        // If this is the first time all items have been measured, update
        // dimensions immediately to avoid unnecessary delays
        if (!initialItemMeasurementsCompleted.value) {
          initialItemMeasurementsCompleted.value = true;
          itemDimensions.modify();
        } else if (usesAbsoluteLayout.value) {
          // In all other cases, debounce the update in case multiple items
          // change their size at the same time
          debounce(itemDimensions.modify, 100);
        }
      }
    }
  );

  const removeItemMeasurements = useUIStableCallback((key: string) => {
    'worklet';
    delete itemDimensions.value[key];
    measuredItemsCount.value = Math.max(0, measuredItemsCount.value - 1);
  });

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

      if (usesAbsoluteLayout.value) {
        if (!controlledContainerDimensions.value.height) {
          containerHeight.value = dimensions.height;
        }
        if (!controlledContainerDimensions.value.width) {
          containerWidth.value = dimensions.width;
        }
      }
    },
    [
      usesAbsoluteLayout,
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
    const measurements = measure(measurementsContainerRef);
    if (measurements) {
      applyMeasuredContainerDimensions(measurements);
    }
  }, [applyMeasuredContainerDimensions, measurementsContainerRef]);

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
        usesAbsoluteLayout.value ||
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

      usesAbsoluteLayout.value = true;
    }
  );

  return {
    value: {
      applyControlledContainerDimensions,
      handleHelperContainerMeasurement,
      handleItemMeasurement,
      measureContainer,
      measurementsContainerRef,
      removeItemMeasurements
    }
  };
});

export { MeasurementsProvider, useMeasurementsContext };
