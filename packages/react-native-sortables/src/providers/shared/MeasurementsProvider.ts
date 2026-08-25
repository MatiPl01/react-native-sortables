import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
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
import { useItemsContext } from './ItemsProvider';
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
    itemCurrentPositions,
    itemHeights,
    itemLayoutPositions,
    itemWidths,
    usesAbsoluteLayout
  } = useCommonValuesContext();
  const { activeItemDimensions: multiZoneActiveItemDimensions } =
    useMultiZoneContext() ?? {};
  const { getKeys } = useItemsContext();

  const context = useMutableValue<null | StateContextType>(null);
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
      const itemsCount = getKeys().length;

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
          debounce.schedule(updateDimensions, measureDebounceDelay);
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
        itemWidths.value = null;
      }
      if (typeof itemHeights.value === 'object') {
        itemHeights.value = null;
      }
    })();
  }, [itemHeights, itemWidths, context]);

  // Re-establish the layout when the app returns to the foreground.
  //
  // Each item's absolute position lives only in a Reanimated shared value whose
  // derived style is pushed to the native view exactly once, when the value
  // changes. After a long background some platforms recreate the sortable's
  // native views; the shared values survive but the freshly committed views
  // never receive the last emitted style (the value did not change, so nothing
  // re-pushes it), so absolutely positioned items collapse onto each other. The
  // first drag is the only thing that mutates a position and thus re-pushes the
  // style, which is why "a drag fixes it".
  //
  // On resume we reproduce that nudge without a drag: re-assign every inactive
  // item's position to its authoritative layout target. The value is unchanged
  // but the write is a fresh object, so Reanimated re-emits the style to the
  // (possibly recreated) view. We also drop the JS dimension cache so a
  // recreated view's onLayout is treated as a fresh measurement rather than
  // diffed away, covering items whose size changed while backgrounded. The
  // active item is skipped so a drag interrupted by backgrounding is not fought.
  // Skipped entirely while still in relative layout, where there are no absolute
  // positions to restore.
  // https://github.com/MatiPl01/react-native-sortables/issues/592
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active') {
        return;
      }
      previousItemDimensionsRef.current = {};
      runOnUI(() => {
        if (!usesAbsoluteLayout.value) {
          return;
        }
        const activeKey = activeItemKey.value;
        const layoutPositions = itemLayoutPositions.value;
        for (const key in itemCurrentPositions.value) {
          if (key === activeKey) {
            continue;
          }
          const target = layoutPositions[key];
          const position = itemCurrentPositions.value[key];
          if (target && position) {
            position.value = { x: target.x, y: target.y };
          }
        }
      })();
    });
    return () => subscription.remove();
  }, [
    activeItemKey,
    itemCurrentPositions,
    itemLayoutPositions,
    usesAbsoluteLayout
  ]);

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
