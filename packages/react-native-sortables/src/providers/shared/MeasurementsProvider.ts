import { useCallback } from 'react';
import type { LayoutChangeEvent, View } from 'react-native';
import {
  measure,
  runOnUI,
  useAnimatedReaction,
  useAnimatedRef,
  useSharedValue
} from 'react-native-reanimated';

import { OFFSET_EPS } from '../../constants';
import { useUIStableCallback } from '../../hooks';
import {
  AbsoluteLayoutState,
  type Dimensions,
  type MeasurementsContextType
} from '../../types';
import { areDimensionsDifferent, useAnimatedDebounce } from '../../utils';
import { createProvider } from '../utils';
import { useCommonValuesContext } from './CommonValuesProvider';

export type MeasurementsProviderProps = {
  itemsCount: number;
};

const { MeasurementsProvider, useMeasurementsContext } = createProvider(
  'Measurements'
)<MeasurementsProviderProps, MeasurementsContextType>(({ itemsCount }) => {
  const {
    absoluteLayoutState,
    activeItemDimensions,
    activeItemKey,
    containerHeight,
    containerWidth,
    controlledContainerDimensions,
    itemDimensions,
    measuredContainerHeight,
    measuredContainerWidth
  } = useCommonValuesContext();

  const measurementsContainerRef = useAnimatedRef<View>();
  const measuredItemsCount = useSharedValue(0);
  const initialItemMeasurementsCompleted = useSharedValue(false);
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
        // Don't update dimensions if the sortable component is first rendered
        // and the layout cannot be changed to absolute (e.g. because sorting
        // hasn't been enabled yet)
        const canUpdateDimensions =
          absoluteLayoutState.value !== AbsoluteLayoutState.Pending;
        // If this is the first time all items have been measured, update
        // dimensions immediately to avoid unnecessary delays
        if (!initialItemMeasurementsCompleted.value) {
          initialItemMeasurementsCompleted.value = true;
          if (canUpdateDimensions) itemDimensions.modify();
        } else if (canUpdateDimensions) {
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

      if (absoluteLayoutState.value === AbsoluteLayoutState.Complete) {
        if (!controlledContainerDimensions.value.height) {
          containerHeight.value = dimensions.height;
        }
        if (!controlledContainerDimensions.value.width) {
          containerWidth.value = dimensions.width;
        }
      }
    },
    [
      absoluteLayoutState,
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
        // Update only if absolute layout is during the transition state
        absoluteLayoutState.value !== AbsoluteLayoutState.Transition ||
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

      absoluteLayoutState.value = AbsoluteLayoutState.Complete;
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
