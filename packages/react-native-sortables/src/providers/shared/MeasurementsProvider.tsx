import { type PropsWithChildren, useCallback, useEffect } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { StyleSheet } from 'react-native';
import {
  runOnUI,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated';

import AnimatedOnLayoutView from '../../components/shared/AnimatedOnLayoutView';
import { OFFSET_EPS } from '../../constants';
import { useUIStableCallback } from '../../hooks';
import type {
  ControlledContainerDimensions,
  Dimensions,
  MeasurementsContextType
} from '../../types';
import type { AnimatedTimeoutID } from '../../utils';
import {
  areDimensionsDifferent,
  clearAnimatedTimeout,
  setAnimatedTimeout
} from '../../utils';
import { createProvider } from '../utils';
import { useCommonValuesContext } from './CommonValuesProvider';

export type MeasurementsProviderProps = PropsWithChildren<{
  controlledContainerDimensions: ControlledContainerDimensions;
  itemsCount: number;
}>;

const { MeasurementsProvider, useMeasurementsContext } = createProvider(
  'Measurements'
)<MeasurementsProviderProps, MeasurementsContextType>(({
  children,
  controlledContainerDimensions,
  itemsCount
}) => {
  const {
    activeItemDimensions,
    activeItemKey,
    appliedContainerDimensions,
    canSwitchToAbsoluteLayout,
    containerRef,
    customHandle,
    itemDimensions,
    measuredContainerDimensions,
    snapItemDimensions
  } = useCommonValuesContext();

  const measuredItemsCount = useSharedValue(0);
  const initialItemMeasurementsCompleted = useSharedValue(false);
  const updateTimeoutId = useSharedValue<AnimatedTimeoutID>(-1);

  useEffect(() => {
    return () => {
      clearAnimatedTimeout(updateTimeoutId.value);
    };
  }, [updateTimeoutId]);

  const handleItemMeasurement = useUIStableCallback(
    (key: string, dimensions: Dimensions) => {
      'worklet';
      const storedDimensions = itemDimensions.value[key];

      if (
        storedDimensions &&
        !areDimensionsDifferent(storedDimensions, dimensions, 0.1)
      ) {
        return;
      }

      if (!itemDimensions.value[key]) {
        measuredItemsCount.value += 1;
      }

      itemDimensions.value[key] = dimensions;
      if (activeItemKey.value === key) {
        activeItemDimensions.value = dimensions;
        if (!customHandle) {
          snapItemDimensions.value = dimensions;
        }
      }

      // Update the array of item dimensions only after all items have been
      // measured to reduce the number of times animated reactions are triggered
      if (measuredItemsCount.value === itemsCount) {
        // If this is the first time all items have been measured, update
        // dimensions immediately to avoid unnecessary delays
        if (!initialItemMeasurementsCompleted.value) {
          initialItemMeasurementsCompleted.value = true;
          itemDimensions.value = { ...itemDimensions.value };
        } else {
          // In all other cases, debounce the update in case multiple items
          // change their size at the same time
          if (updateTimeoutId.value !== -1) {
            clearAnimatedTimeout(updateTimeoutId.value);
          }
          updateTimeoutId.value = setAnimatedTimeout(() => {
            itemDimensions.value = { ...itemDimensions.value };
            updateTimeoutId.value = -1;
          }, 100);
        }
      }
    }
  );

  const handleItemRemoval = useUIStableCallback((key: string) => {
    'worklet';
    delete itemDimensions.value[key];
    measuredItemsCount.value = Math.max(0, measuredItemsCount.value - 1);
  });

  /**
   * Updates the dimensions of the handle that is currently being touched
   * (only if there is no custom handle and the entire item is treated as a handle)
   */
  const setItemDimensionsAsSnapDimensions = useCallback(
    (key: string) => {
      'worklet';
      snapItemDimensions.value = itemDimensions.value[key] ?? null;
    },
    [itemDimensions, snapItemDimensions]
  );

  const applyControlledContainerDimensions = useCallback(
    (dimensions: Partial<Dimensions>) => {
      'worklet';
      switch (controlledContainerDimensions) {
        case 'both': {
          if (
            appliedContainerDimensions.value?.height !== dimensions.height ||
            appliedContainerDimensions.value?.width !== dimensions.width
          ) {
            appliedContainerDimensions.value = dimensions;
          }
          break;
        }
        case 'height': {
          if (appliedContainerDimensions.value?.height !== dimensions.height) {
            appliedContainerDimensions.value = { height: dimensions.height };
          }
          break;
        }
        case 'width': {
          if (appliedContainerDimensions.value?.width !== dimensions.width) {
            appliedContainerDimensions.value = { width: dimensions.width };
          }
          break;
        }
      }
    },
    [appliedContainerDimensions, controlledContainerDimensions]
  );

  const handleHelperContainerMeasurement = useCallback(
    ({
      nativeEvent: {
        layout: { height, width }
      }
    }: LayoutChangeEvent) => {
      runOnUI(() => {
        const layoutDimensions = { height, width };
        if (
          measuredContainerDimensions.value === null ||
          areDimensionsDifferent(
            measuredContainerDimensions.value,
            layoutDimensions
          )
        ) {
          measuredContainerDimensions.value = layoutDimensions;
        }
      })();
    },
    [measuredContainerDimensions]
  );

  useAnimatedReaction(
    () => ({
      appliedDimensions: appliedContainerDimensions.value,
      itemMeasurementsCompleted: initialItemMeasurementsCompleted.value,
      measuredDimensions: measuredContainerDimensions.value
    }),
    ({ appliedDimensions, itemMeasurementsCompleted, measuredDimensions }) => {
      canSwitchToAbsoluteLayout.value = !!(
        measuredDimensions &&
        appliedDimensions &&
        itemMeasurementsCompleted &&
        (appliedDimensions.height === undefined ||
          Math.abs(measuredDimensions.height - appliedDimensions.height) <
            OFFSET_EPS) &&
        (appliedDimensions.width === undefined ||
          Math.abs(measuredDimensions.width - appliedDimensions.width) <
            OFFSET_EPS)
      );
    }
  );

  const animatedContainerStyle = useAnimatedStyle(() => ({
    ...appliedContainerDimensions.value
  }));

  return {
    children: (
      <>
        <AnimatedOnLayoutView
          ref={containerRef}
          style={[styles.helperContainer, animatedContainerStyle]}
          onLayout={handleHelperContainerMeasurement}
        />
        {children}
      </>
    ),
    value: {
      applyControlledContainerDimensions,
      handleItemMeasurement,
      handleItemRemoval,
      setItemDimensionsAsSnapDimensions
    }
  };
});

const styles = StyleSheet.create({
  helperContainer: {
    left: 0,
    position: 'absolute',
    top: 0
  }
});

export { MeasurementsProvider, useMeasurementsContext };
