import { useCallback } from 'react';
import { runOnUI, useAnimatedReaction } from 'react-native-reanimated';

import { useStableCallback } from '../../hooks';
import {
  setAnimatedTimeout,
  useAnimatedDebounce,
  useMutableValue
} from '../../integrations/reanimated';
import type { Dimensions, MeasurementsContextType } from '../../types';
import { areDimensionsDifferent } from '../../utils';
import { createProvider } from '../utils';
import { useCommonValuesContext } from './CommonValuesProvider';
import { useMultiZoneContext } from './MultiZoneProvider';

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
    usesAbsoluteLayout
  } = useCommonValuesContext();
  const { activeItemDimensions: multiZoneActiveItemDimensions } =
    useMultiZoneContext() ?? {};

  const measuredItemsCount = useMutableValue(0);
  const initialItemMeasurementsCompleted = useMutableValue(false);
  const debounce = useAnimatedDebounce();

  const handleItemMeasurement = useStableCallback(
    runOnUI((key: string, dimensions: Dimensions) => {
      'worklet';
      const storedDimensions = itemDimensions.value[key];

      if (
        storedDimensions &&
        !areDimensionsDifferent(storedDimensions, dimensions, 1)
      ) {
        return;
      }

      let newItemMeasured = false;
      if (!itemDimensions.value[key]) {
        measuredItemsCount.value += 1;
        newItemMeasured = true;
      }

      itemDimensions.value[key] = dimensions;
      if (activeItemKey.value === key) {
        activeItemDimensions.value = dimensions;
        if (multiZoneActiveItemDimensions) {
          multiZoneActiveItemDimensions.value = dimensions;
        }
      }

      // Update the array of item dimensions only after all items have been
      // measured to reduce the number of times animated reactions are triggered
      if (measuredItemsCount.value === itemsCount) {
        initialItemMeasurementsCompleted.value = true;

        if (newItemMeasured) {
          // If measurements were triggered because of adding new items and all new
          // items have been measured, update dimensions immediately to avoid
          // unnecessary delays
          itemDimensions.modify();
        } else {
          // Otherwise, debounce the update if the number of items is not changed
          // to reduce the number of updates if dimensions of items are changed
          // many times within a short period of time
          debounce(itemDimensions.modify, 100);
        }
      }
    })
  );

  const removeItemMeasurements = useCallback(
    (key: string) => {
      'worklet';
      delete itemDimensions.value[key];
      measuredItemsCount.value = Math.max(0, measuredItemsCount.value - 1);
    },
    [itemDimensions, measuredItemsCount]
  );

  const handleContainerMeasurement = useCallback(
    (width: number, height: number) => {
      'worklet';
      const ctrl = controlledContainerDimensions.value;

      if (!ctrl.width) {
        containerWidth.value = width;
      }
      if (!ctrl.height) {
        containerHeight.value = height;
      }
    },
    [controlledContainerDimensions, containerHeight, containerWidth]
  );

  const applyControlledContainerDimensions = useCallback(
    (dimensions: Partial<Dimensions>) => {
      'worklet';
      const ctrl = controlledContainerDimensions.value;

      if (ctrl.height && dimensions.height !== undefined) {
        containerHeight.value = dimensions.height;
      }
      if (ctrl.width && dimensions.width !== undefined) {
        containerWidth.value = dimensions.width;
      }
    },
    [containerHeight, containerWidth, controlledContainerDimensions]
  );

  useAnimatedReaction(
    () => ({
      containerH: containerHeight.value,
      containerW: containerWidth.value,
      itemMeasurementsCompleted: initialItemMeasurementsCompleted.value
    }),
    ({ containerH, containerW, itemMeasurementsCompleted }) => {
      if (
        usesAbsoluteLayout.value ||
        !itemMeasurementsCompleted ||
        !containerH ||
        !containerW
      ) {
        return;
      }

      // Add timeout for safety, to prevent too many updates in a short period of time
      // (this may cause perf issues on low end devices, so the update is delayed for safety)
      setAnimatedTimeout(() => {
        usesAbsoluteLayout.value = true;
      }, 100);
    }
  );

  return {
    value: {
      applyControlledContainerDimensions,
      handleContainerMeasurement,
      handleItemMeasurement,
      removeItemMeasurements
    }
  };
});

export { MeasurementsProvider, useMeasurementsContext };
