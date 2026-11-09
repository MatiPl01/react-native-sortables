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

type StateContextType = {
  measuredItemKeys: Set<string>;
  queuedMeasurements: Map<string, Dimensions>;
};

type MeasurementsProviderProps = {
  measureDebounceDelay: number;
};

const { MeasurementsProvider, useMeasurementsContext } = createProvider(
  'Measurements'
)<MeasurementsProviderProps, MeasurementsContextType>(({
  measureDebounceDelay
}) => {
  const {
    activeItemDimensions,
    activeItemKey,
    containerHeight,
    containerWidth,
    controlledContainerDimensions,
    controlledItemDimensions,
    indexToKey,
    itemHeights,
    itemWidths,
    usesAbsoluteLayout
  } = useCommonValuesContext();
  const { activeItemDimensions: multiZoneActiveItemDimensions } =
    useMultiZoneContext() ?? {};

  const context = useMutableValue<null | StateContextType>(null);
  const previousItemDimensionsRef = useRef<Record<string, Dimensions>>({});
  const debounce = useAnimatedDebounce();

  // Ask the currently rendered items whether the batch is complete, rather than
  // comparing how many were measured: a count stops matching for good once a key
  // the component no longer renders enters the tally, which a layout event
  // delivered after React unmounted that item does.
  const areAllItemsMeasured = useCallback(
    (ctx: StateContextType) => {
      'worklet';
      return indexToKey.value.every(
        key =>
          ctx.queuedMeasurements.has(key) ||
          (resolveDimension(itemWidths.value, key) !== null &&
            resolveDimension(itemHeights.value, key) !== null)
      );
    },
    [indexToKey, itemHeights, itemWidths]
  );

  const applyQueuedMeasurements = useCallback(
    (ctx: StateContextType) => {
      'worklet';
      const { height: isHeightControlled, width: isWidthControlled } =
        controlledItemDimensions;

      const updateDimension = (
        dimension: Dimension,
        sizes: SharedValue<ItemSizes>
      ) => {
        const newSizes = { ...(sizes.value as Record<string, number>) };
        for (const [k, dims] of ctx.queuedMeasurements.entries()) {
          newSizes[k] = dims[dimension];
        }
        sizes.value = newSizes;
      };

      if (!isWidthControlled) {
        updateDimension('width', itemWidths);
      }
      if (!isHeightControlled) {
        updateDimension('height', itemHeights);
      }

      ctx.queuedMeasurements.clear();
      debounce.cancel();
    },
    [controlledItemDimensions, debounce, itemHeights, itemWidths]
  );

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
        if (!areAllItemsMeasured(ctx)) {
          return;
        }

        if (
          isNewItem ||
          ctx.queuedMeasurements.size === indexToKey.value.length
        ) {
          // Update dimensions immediately to avoid unnecessary delays when:
          // - measurements were triggered because of adding new items and all new items have been measured
          // - all sortable container items' dimensions have changed (e.g. when someone creates collapsible
          //   items which change their height when the user starts dragging them)
          applyQueuedMeasurements(ctx);
        } else {
          // In all other cases, debounce the update to reduce the number of
          // updates when dimensions change many times within a short period of time
          debounce.schedule(() => {
            'worklet';
            applyQueuedMeasurements(ctx);
          }, measureDebounceDelay);
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

        const ctx = context.value;
        if (!ctx) {
          return;
        }

        ctx.measuredItemKeys.delete(key);
        ctx.queuedMeasurements.delete(key);

        // Removing an item can be what completes a batch that was waiting for
        // it, and nothing else would retry: the items already measured report
        // no further layout, so their sizes would stay queued indefinitely.
        if (ctx.queuedMeasurements.size > 0 && areAllItemsMeasured(ctx)) {
          applyQueuedMeasurements(ctx);
        }
      })();
    },
    [
      applyQueuedMeasurements,
      areAllItemsMeasured,
      controlledItemDimensions,
      itemHeights,
      itemWidths,
      context
    ]
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
        itemWidths.value = null;
      }
      if (typeof itemHeights.value === 'object') {
        itemHeights.value = null;
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
