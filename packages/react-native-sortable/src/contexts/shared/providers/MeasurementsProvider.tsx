import { type PropsWithChildren, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue
} from 'react-native-reanimated';

import { useStableCallback, useUIStableCallback } from '../../../hooks';
import type { Dimensions } from '../../../types';
import {
  type AnimatedTimeoutID,
  areDimensionsDifferent,
  clearAnimatedTimeout,
  maybeUpdateValue,
  setAnimatedTimeout
} from '../../../utils';
import { createEnhancedContext } from '../../utils';
import { useDragContext } from './DragProvider';
import { OFFSET_EPS } from '../../../constants';

type MeasurementsContextType = {
  itemDimensions: SharedValue<Record<string, Dimensions>>;
  touchedItemWidth: SharedValue<number>;
  touchedItemHeight: SharedValue<number>;
  overrideItemDimensions: SharedValue<Record<string, Partial<Dimensions>>>;
  containerHeight: SharedValue<number>;
  containerWidth: SharedValue<number>;
  canSwitchToAbsoluteLayout: SharedValue<boolean>;
  handleItemMeasurement: (key: string, dimensions: Dimensions) => void;
  handleItemRemoval: (key: string) => void;
  updateTouchedItemDimensions: (key: string) => void;
};

type MeasurementsProviderProps = PropsWithChildren<{
  itemsCount: number;
}>;

const { MeasurementsProvider, useMeasurementsContext } = createEnhancedContext(
  'Measurements'
)<MeasurementsContextType, MeasurementsProviderProps>(({
  children,
  itemsCount
}) => {
  const { touchedItemKey } = useDragContext();

  const measuredItemsCount = useSharedValue(0);
  const initialItemMeasurementsCompleted = useSharedValue(false);
  const containerHeightApplied = useSharedValue(false);
  const updateTimeoutId = useSharedValue<AnimatedTimeoutID>(-1);

  const touchedItemWidth = useSharedValue<number>(-1);
  const touchedItemHeight = useSharedValue<number>(-1);
  const itemDimensions = useSharedValue<Record<string, Dimensions>>({});
  const overrideItemDimensions = useSharedValue<
    Record<string, Partial<Dimensions>>
  >({});
  const containerWidth = useSharedValue(-1);
  const containerHeight = useSharedValue(-1);
  const canSwitchToAbsoluteLayout = useDerivedValue(() => containerHeightApplied.value && initialItemMeasurementsCompleted.value);


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
      if (touchedItemKey.value === key) {
        touchedItemWidth.value = dimensions.width;
        touchedItemHeight.value = dimensions.height;
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

  const handleContainerWidthMeasurement = useUIStableCallback(
    (width: number) => {
      'worklet';
      maybeUpdateValue(containerWidth, width, OFFSET_EPS);
    }
  );

  const handleHelperContainerHeightMeasurement = useStableCallback(
    (height: number) => {
      'worklet';
      console.log({ height, containerHeight: containerHeight.value });
      if (height === containerHeight.value) {
        containerHeightApplied.value = true;
      }
    }
  );

  const updateTouchedItemDimensions = useCallback(
    (key: string) => {
      'worklet';
      const dimensions = itemDimensions.value[key] ?? null;
      touchedItemWidth.value = dimensions?.width ?? -1;
      touchedItemHeight.value = dimensions?.height ?? -1;
    },
    [itemDimensions, touchedItemWidth, touchedItemHeight]
  );

  const animatedContainerStyle = useAnimatedStyle(() => ({
    height: containerHeight.value === -1 ? undefined : containerHeight.value
  }));

  return {
    children: (
      <Animated.View
        style={[
          styles.container,
          animatedContainerStyle,
          { backgroundColor: 'red' }
        ]}
        onLayout={({ nativeEvent: { layout } }) =>
          handleContainerWidthMeasurement(layout.width)
        }>
        {/* Helper component used to ensure that the calculated container height
        used in the animated style was applied and items can be absolutely positioned
        (onLayout on the real container is not called again as the calculated height
        is (at least, should be) as the height determined by the total height of its
        content, so we have to use a dummy component) */}
        <Animated.View
          style={[styles.helperContainer, animatedContainerStyle, { width: 10, backgroundColor: 'blue'}]}
          onLayout={({ nativeEvent: { layout } }) =>
            handleHelperContainerHeightMeasurement(layout.height)
          }
        />
        {children}
      </Animated.View>
    ),
    value: {
      containerHeight,
      containerWidth,
      itemDimensions,
      handleItemMeasurement,
      overrideItemDimensions,
      canSwitchToAbsoluteLayout,
      handleItemRemoval,
      touchedItemHeight,
      touchedItemWidth,
      updateTouchedItemDimensions
    }
  };
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  helperContainer: {
    position: 'absolute',
  }
});

export { MeasurementsProvider, useMeasurementsContext };
