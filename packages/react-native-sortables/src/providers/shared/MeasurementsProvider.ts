import { useCallback, useRef } from 'react';
import { runOnUI } from 'react-native-reanimated';

import { useStableCallback } from '../../hooks';
import {
  useAnimatedDebounce,
  useMutableValue
} from '../../integrations/reanimated';
import type { Dimensions, MeasurementsContextType } from '../../types';
import { areValuesDifferent } from '../../utils';
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
    controlledItemDimensions,
    itemHeights,
    itemWidths
  } = useCommonValuesContext();
  const { activeItemDimensions: multiZoneActiveItemDimensions } =
    useMultiZoneContext() ?? {};

  const measuredItemsCount = useMutableValue(0);
  const previousItemDimensionsRef = useRef<Record<string, Dimensions>>({});
  const debounce = useAnimatedDebounce();

  const handleItemMeasurement = useStableCallback(
    (key: string, dimensions: Dimensions) => {
      const prevDimensions = previousItemDimensionsRef.current[key];
      previousItemDimensionsRef.current[key] = dimensions;

      const { height: isHeightControlled, width: isWidthControlled } =
        controlledItemDimensions;
      if (isWidthControlled && isHeightControlled) {
        return;
      }

      const changedDimensions: Partial<Dimensions> = {};
      const isNewItem = !prevDimensions;

      if (
        !isWidthControlled &&
        areValuesDifferent(prevDimensions?.width, dimensions.width, 1)
      ) {
        changedDimensions.width = dimensions.width;
      }
      if (
        !isHeightControlled &&
        areValuesDifferent(prevDimensions?.height, dimensions.height, 1)
      ) {
        changedDimensions.height = dimensions.height;
      }

      if (!Object.keys(changedDimensions).length) {
        return;
      }

      runOnUI(() => {
        if (isNewItem) {
          measuredItemsCount.value += 1;
        }

        if (!isWidthControlled) {
          (itemWidths.value as Record<string, number>)[key] = dimensions.width;
        }
        if (!isHeightControlled) {
          (itemHeights.value as Record<string, number>)[key] =
            dimensions.height;
        }

        if (activeItemKey.value === key) {
          activeItemDimensions.value = dimensions;
          if (multiZoneActiveItemDimensions) {
            multiZoneActiveItemDimensions.value = dimensions;
          }
        }

        // Update the array of item dimensions only after all items have been
        // measured to reduce the number of times animated reactions are triggered
        if (measuredItemsCount.value === itemsCount) {
          const updateDimensions = () => {
            if (isWidthControlled) itemWidths.modify();
            if (isHeightControlled) itemHeights.modify();
          };

          if (isNewItem) {
            // If measurements were triggered because of adding new items and all new
            // items have been measured, update dimensions immediately to avoid
            // unnecessary delays
            updateDimensions();
          } else {
            // Otherwise, debounce the update if the number of items is not changed
            // to reduce the number of updates if dimensions of items are changed
            // many times within a short period of time
            debounce(updateDimensions, 100);
          }
        }
      })();
    }
  );

  const removeItemMeasurements = useCallback(
    (key: string) => {
      delete previousItemDimensionsRef.current[key];
      const { height: isHeightControlled, width: isWidthControlled } =
        controlledItemDimensions;
      if (isWidthControlled && isHeightControlled) {
        return;
      }

      runOnUI(() => {
        if (!isWidthControlled) {
          delete (itemWidths.value as Record<string, number>)[key];
        }
        if (!isHeightControlled) {
          delete (itemHeights.value as Record<string, number>)[key];
        }
        measuredItemsCount.value -= 1;
      })();
    },
    [controlledItemDimensions, itemHeights, itemWidths, measuredItemsCount]
  );

  const handleContainerMeasurement = useCallback(
    (width: number, height: number) => {
      'worklet';
      if (!controlledContainerDimensions.width) {
        containerWidth.value = width;
      }
      if (!controlledContainerDimensions.height) {
        containerHeight.value = height;
      }
    },
    [controlledContainerDimensions, containerHeight, containerWidth]
  );

  const applyControlledContainerDimensions = useCallback(
    (dimensions: Partial<Dimensions>) => {
      'worklet';
      if (
        controlledContainerDimensions.width &&
        dimensions.width !== undefined
      ) {
        containerWidth.value = dimensions.width;
      }
      if (
        controlledContainerDimensions.height &&
        dimensions.height !== undefined
      ) {
        containerHeight.value = dimensions.height;
      }
    },
    [containerHeight, containerWidth, controlledContainerDimensions]
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
