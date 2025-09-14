import { useCallback, useEffect } from 'react';
import type { AnimatedRef } from 'react-native-reanimated';
import type Animated from 'react-native-reanimated';
import { measure, runOnUI } from 'react-native-reanimated';

import { useStableCallback } from '../../hooks';
import {
  setAnimatedTimeout,
  useMutableValue
} from '../../integrations/reanimated';
import type { Dimensions, MeasurementsContextType } from '../../types';
import { areValuesDifferent, resolveDimension } from '../../utils';
import { createProvider } from '../utils';
import { useCommonValuesContext } from './CommonValuesProvider';
import { useItemsContext } from './ItemsProvider';
import { useMultiZoneContext } from './MultiZoneProvider';

const { MeasurementsProvider, useMeasurementsContext } = createProvider(
  'Measurements'
)<Record<string, never>, MeasurementsContextType>(() => {
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
  const { subscribeItems } = useItemsContext();

  const itemRefs = useMutableValue<Record<string, AnimatedRef<Animated.View>>>(
    {}
  );

  const measureItems = useCallback(
    (keys: Array<string>) => {
      'worklet';
      let hasWidthUpdates = false;
      const widthUpdates: Record<string, number> = {};

      let hasHeightUpdates = false;
      const heightUpdates: Record<string, number> = {};

      for (const key of keys) {
        const itemRef = itemRefs.value[key];
        if (!itemRef) {
          continue;
        }

        const measurements = measure(itemRef);
        if (!measurements) {
          continue;
        }

        const { height, width } = measurements;
        if (!controlledItemDimensions.width) {
          const resolvedWidth = resolveDimension(itemWidths.value, key);
          if (
            resolvedWidth === null ||
            areValuesDifferent(resolvedWidth, width, 1)
          ) {
            widthUpdates[key] = width;
            hasWidthUpdates = true;
          }
        }
        if (!controlledItemDimensions.height) {
          const resolvedHeight = resolveDimension(itemHeights.value, key);
          if (
            resolvedHeight === null ||
            areValuesDifferent(resolvedHeight, height, 1)
          ) {
            heightUpdates[key] = height;
            hasHeightUpdates = true;
          }
        }
      }

      if (hasWidthUpdates) {
        itemWidths.value = {
          ...(itemWidths.value as Record<string, number>),
          ...widthUpdates
        };
      }
      if (hasHeightUpdates) {
        itemHeights.value = {
          ...(itemHeights.value as Record<string, number>),
          ...heightUpdates
        };
      }

      const activeKey = activeItemKey.value;
      if (
        activeKey &&
        (widthUpdates[activeKey] !== undefined ||
          heightUpdates[activeKey] !== undefined)
      ) {
        const dimensions = {
          height: heightUpdates[activeKey]!,
          width: widthUpdates[activeKey]!
        };
        activeItemDimensions.value = dimensions;
        if (multiZoneActiveItemDimensions) {
          multiZoneActiveItemDimensions.value = dimensions;
        }
      }
    },
    [
      itemRefs,
      controlledItemDimensions,
      itemHeights,
      itemWidths,
      activeItemDimensions,
      multiZoneActiveItemDimensions,
      activeItemKey
    ]
  );

  useEffect(
    () => subscribeItems(runOnUI(measureItems)),
    [measureItems, subscribeItems]
  );

  const registerItem = useStableCallback(
    (key: string, ref: AnimatedRef<Animated.View>) => {
      runOnUI(() => {
        itemRefs.value[key] = ref;
      })();

      return runOnUI(() => {
        delete itemRefs.value[key];
      });
    }
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

  return {
    value: {
      applyControlledContainerDimensions,
      handleContainerMeasurement,
      registerItem
    }
  };
});

export { MeasurementsProvider, useMeasurementsContext };
