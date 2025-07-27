import { useCallback, useRef } from 'react';
import { runOnUI } from 'react-native-reanimated';

import { useStableCallback } from '../../hooks';
import {
  setAnimatedTimeout,
  useAnimatedDebounce,
  useMutableValue
} from '../../integrations/reanimated';
import type {
  ControlledDimensions,
  Dimensions,
  MeasurementsContextType
} from '../../types';
import { areValuesDifferent } from '../../utils';
import { createProvider } from '../utils';
import { useCommonValuesContext } from './CommonValuesProvider';
import { useMultiZoneContext } from './MultiZoneProvider';
import { resolveDimension } from './utils';

export type ItemDimensionsValidator = (
  resolvedWidth: number | undefined,
  resolvedHeight: number | undefined,
  controlledDimensions: ControlledDimensions,
  measuredDimensions: Dimensions
) => boolean;

type MeasurementsProviderProps = {
  itemsCount: number;
  validateDimensions: ItemDimensionsValidator | undefined;
};

const { MeasurementsProvider, useMeasurementsContext } = createProvider(
  'Measurements'
)<MeasurementsProviderProps, MeasurementsContextType>(({
  itemsCount,
  validateDimensions
}) => {
  const {
    activeItemDimensions,
    activeItemKey,
    containerHeight,
    containerWidth,
    controlledContainerDimensions,
    controlledItemDimensions,
    itemHeights,
    itemWidths,
    usesAbsoluteLayout
  } = useCommonValuesContext();
  const { activeItemDimensions: multiZoneActiveItemDimensions } =
    useMultiZoneContext() ?? {};

  const measuredItemsCount = useMutableValue(0);
  const previousItemDimensionsRef = useRef<Record<string, Dimensions>>({});
  const debounce = useAnimatedDebounce();

  const handleItemMeasurement = useStableCallback(
    (key: string, dimensions: Dimensions) => {
      const prevDimensions = previousItemDimensionsRef.current[key];

      const { height: isHeightControlled, width: isWidthControlled } =
        controlledItemDimensions;
      if (isWidthControlled && isHeightControlled) {
        return;
      }

      const changedDimensions: Partial<Dimensions> = {};

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

      previousItemDimensionsRef.current[key] = dimensions;

      runOnUI(() => {
        const resolvedWidth = resolveDimension(itemWidths.value, key);
        const resolvedHeight = resolveDimension(itemHeights.value, key);

        if (
          validateDimensions &&
          !validateDimensions(
            resolvedWidth,
            resolvedHeight,
            controlledItemDimensions,
            dimensions
          )
        ) {
          return;
        }

        const isNewItem =
          resolvedWidth === undefined || resolvedHeight === undefined;
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
            if (!isWidthControlled) itemWidths.modify();
            if (!isHeightControlled) itemHeights.modify();
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

      if (!usesAbsoluteLayout.value) {
        // Add timeout for safety, to prevent too many layout recalculations
        // in a short period of time (this may cause issues on low end devices)
        setAnimatedTimeout(() => {
          usesAbsoluteLayout.value = true;
        }, 100);
      }
    },
    [
      containerHeight,
      containerWidth,
      controlledContainerDimensions,
      usesAbsoluteLayout
    ]
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
