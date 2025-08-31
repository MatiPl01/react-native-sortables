import { useCallback, useRef } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import { runOnUI } from 'react-native-reanimated';

import { useStableCallback } from '../../hooks';
import {
  setAnimatedTimeout,
  useAnimatedDebounce,
  useMutableValue
} from '../../integrations/reanimated';
import type {
  Dimension,
  Dimensions,
  ItemSizes,
  MeasurementsContextType
} from '../../types';
import { areValuesDifferent, resolveDimension } from '../../utils';
import { createProvider } from '../utils';
import { useCommonValuesContext } from './CommonValuesProvider';
import { useMultiZoneContext } from './MultiZoneProvider';

const DEBOUNCE_DURATION = 100;

type StateContext = {
  measuredItemKeys: Set<string>;
  queuedMeasurements: Map<string, Dimensions>;
};

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
    itemWidths,
    usesAbsoluteLayout
  } = useCommonValuesContext();
  const { activeItemDimensions: multiZoneActiveItemDimensions } =
    useMultiZoneContext() ?? {};

  const context = useMutableValue<null | StateContext>(null);
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
        context.value ??= {
          measuredItemKeys: new Set(),
          queuedMeasurements: new Map()
        };

        const ctx = context.value;

        const isNewItem =
          !ctx.measuredItemKeys.has(key) &&
          (resolveDimension(itemWidths.value, key) === null ||
            resolveDimension(itemHeights.value, key) === null);

        if (isNewItem) {
          ctx.measuredItemKeys.add(key);
        }

        ctx.queuedMeasurements.set(key, dimensions);

        if (activeItemKey.value === key) {
          activeItemDimensions.value = dimensions;
          if (multiZoneActiveItemDimensions) {
            multiZoneActiveItemDimensions.value = dimensions;
          }
        }

        // Update the array of item dimensions only after all items have been
        // measured to reduce the number of times animated reactions are triggered
        if (ctx.measuredItemKeys.size !== itemsCount) {
          return;
        }

        const updateDimensions = () => {
          const updateDimension = (
            dimension: Dimension,
            sizes: SharedValue<ItemSizes>
          ) => {
            for (const [k, dims] of ctx.queuedMeasurements.entries()) {
              (sizes.value as Record<string, number>)[k] = dims[dimension];
            }
            sizes.modify();
          };

          if (!isWidthControlled) {
            updateDimension('width', itemWidths);
          }
          if (!isHeightControlled) {
            updateDimension('height', itemHeights);
          }

          ctx.queuedMeasurements.clear();
          debounce.cancel();
        };

        if (isNewItem || ctx.queuedMeasurements.size === itemsCount) {
          // Update dimensions immediately to avoid unnecessary delays when:
          // - measurements were triggered because of adding new items and all new items have been measured
          // - all sortable container items' dimensions have changed (e.g. when someone creates collapsible
          //   items which change their height when the user starts dragging them)
          updateDimensions();
        } else {
          // In all other cases, debounce the update to reduce the number of
          // updates when dimensions change many times within a short period of time
          debounce.schedule(updateDimensions, DEBOUNCE_DURATION);
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
        if (itemWidths.value && typeof itemWidths.value === 'object') {
          delete itemWidths.value[key];
        }
        if (itemHeights.value && typeof itemHeights.value === 'object') {
          delete itemHeights.value[key];
        }
        context.value?.measuredItemKeys.delete(key);
      })();
    },
    [controlledItemDimensions, itemHeights, itemWidths, context]
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
        // in a short period of time (this may cause issues on low-end devices)
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

  const resetMeasurements = useCallback(() => {
    previousItemDimensionsRef.current = {};
    runOnUI(() => {
      context.value = null;
      if (typeof itemWidths.value === 'object') {
        itemWidths.value = {};
      }
      if (typeof itemHeights.value === 'object') {
        itemHeights.value = {};
      }
    })();
  }, [itemHeights, itemWidths, context]);

  return {
    value: {
      applyControlledContainerDimensions,
      handleContainerMeasurement,
      handleItemMeasurement,
      removeItemMeasurements,
      resetMeasurements
    }
  };
});

export { MeasurementsProvider, useMeasurementsContext };
