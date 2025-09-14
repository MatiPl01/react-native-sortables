import { useCallback, useEffect, useRef } from 'react';
import type { View } from 'react-native';
import { runOnUI } from 'react-native-reanimated';

import { setAnimatedTimeout } from '../../integrations/reanimated';
import type { Dimensions, MeasurementsContextType } from '../../types';
import { areValuesDifferent } from '../../utils';
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

  const prevItemDimensionsRef = useRef<Record<string, Dimensions>>({});
  const itemRefs = useRef<Record<string, View>>({});

  const updateDimensionsUI = useCallback(
    (
      widthUpdates: null | Record<string, number>,
      heightUpdates: null | Record<string, number>
    ) => {
      'worklet';
      if (widthUpdates) {
        itemWidths.value = {
          ...(itemWidths.value as Record<string, number>),
          ...widthUpdates
        };
      }
      if (heightUpdates) {
        itemHeights.value = {
          ...(itemHeights.value as Record<string, number>),
          ...heightUpdates
        };
      }

      const activeKey = activeItemKey.value;
      if (activeKey === null) {
        return;
      }

      const newHeight =
        heightUpdates?.[activeKey] ?? activeItemDimensions.value?.height;
      const newWidth =
        widthUpdates?.[activeKey] ?? activeItemDimensions.value?.width;

      if (newHeight === undefined || newWidth === undefined) {
        return;
      }

      activeItemDimensions.value = {
        height: newHeight,
        width: newWidth
      };
      if (multiZoneActiveItemDimensions) {
        multiZoneActiveItemDimensions.value = {
          height: newHeight,
          width: newWidth
        };
      }
    },
    [
      itemHeights,
      itemWidths,
      activeItemDimensions,
      multiZoneActiveItemDimensions,
      activeItemKey
    ]
  );

  useEffect(
    () =>
      subscribeItems(itemKeys => {
        const updatedWidths: Record<string, number> = {};
        let hasWidthUpdates = false;
        const updatedHeights: Record<string, number> = {};
        let hasHeightUpdates = false;

        itemKeys.forEach(key => {
          itemRefs.current[key]?.measure((_x, _y, width, height) => {
            const prevDimensions = prevItemDimensionsRef.current[key];

            if (
              !controlledItemDimensions.width &&
              (!prevDimensions ||
                areValuesDifferent(prevDimensions.width, width, 1))
            ) {
              updatedWidths[key] = width;
              hasWidthUpdates = true;
            }
            if (
              !controlledItemDimensions.height &&
              (!prevDimensions ||
                areValuesDifferent(prevDimensions.height, height, 1))
            ) {
              updatedHeights[key] = height;
              hasHeightUpdates = true;
            }

            prevItemDimensionsRef.current[key] = { height, width };
          });
        });

        const widthUpdates = hasWidthUpdates ? updatedWidths : null;
        const heightUpdates = hasHeightUpdates ? updatedHeights : null;

        if (widthUpdates || heightUpdates) {
          runOnUI(updateDimensionsUI)(widthUpdates, heightUpdates);
        }
      }),
    [subscribeItems, itemRefs, updateDimensionsUI, controlledItemDimensions]
  );

  const updateItemRef = useCallback((key: string, instance: null | View) => {
    if (instance) {
      itemRefs.current[key] = instance;
    } else {
      delete itemRefs.current[key];
    }
  }, []);

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
      updateItemRef
    }
  };
});

export { MeasurementsProvider, useMeasurementsContext };
