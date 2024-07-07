import { type PropsWithChildren, useCallback } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { StyleSheet } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

import { useAnimatedTimeout, useUICallback } from '../../hooks';
import type { Dimensions } from '../../types';
import { createEnhancedContext } from '../utils';
import { useDragContext } from './DragProvider';

type MeasurementsContextType = {
  measurementsCompleted: SharedValue<boolean>;
  itemDimensions: SharedValue<Record<string, Dimensions>>;
  overrideItemDimensions: SharedValue<Record<string, Partial<Dimensions>>>;
  targetContainerHeight: SharedValue<number>;
  animatedContainerHeight: SharedValue<number>;
  targetContainerWidth: SharedValue<number>;
  measureItem: (key: string, dimensions: Dimensions) => void;
  removeItem: (key: string) => void;
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
  const { activationProgress } = useDragContext();

  const measuredItemsCount = useSharedValue(0);

  const updateTimeout = useAnimatedTimeout();
  const measurementsCompleted = useSharedValue(false);
  const itemDimensions = useSharedValue<Record<string, Dimensions>>({});
  const overrideItemDimensions = useSharedValue<
    Record<string, Partial<Dimensions>>
  >({});

  const targetContainerWidth = useSharedValue(-1);
  const targetContainerHeight = useSharedValue(-1);
  const animatedContainerHeight = useSharedValue(-1);

  const updateMeasurements = useCallback(
    (update: () => void) => {
      'worklet';
      // Set to false while measurements are being updated
      measurementsCompleted.value = false;

      // Update the measurements
      update();

      // Debounce the update to the measurements array to optimize performance
      // (decrease the number of times animated reactions are triggered)
      // Update only if the number of measurements is the same as the number of items
      if (measuredItemsCount.value === itemsCount) {
        updateTimeout.clear();
        updateTimeout.set(() => {
          measurementsCompleted.value = true;
          itemDimensions.value = { ...itemDimensions.value };
        }, 100);
      }
    },
    [
      itemDimensions,
      itemsCount,
      measuredItemsCount,
      measurementsCompleted,
      updateTimeout
    ]
  );

  const measureItem = useUICallback((key: string, dimensions: Dimensions) => {
    'worklet';
    updateMeasurements(() => {
      if (!itemDimensions.value[key]) {
        measuredItemsCount.value += 1;
      }
      itemDimensions.value[key] = dimensions;
    });
  });

  const removeItem = useUICallback((key: string) => {
    'worklet';
    updateMeasurements(() => {
      delete itemDimensions.value[key];
      measuredItemsCount.value = Math.max(0, measuredItemsCount.value - 1);
    });
  });

  const measureContainer = useCallback(
    ({
      nativeEvent: {
        layout: { width }
      }
    }: LayoutChangeEvent) => {
      targetContainerWidth.value = width;
    },
    [targetContainerWidth]
  );

  useAnimatedReaction(
    () => targetContainerHeight.value,
    targetHeight => {
      if (targetHeight === -1) {
        return;
      }
      if (animatedContainerHeight.value === -1) {
        animatedContainerHeight.value = targetHeight;
      } else {
        animatedContainerHeight.value = withTiming(targetHeight);
      }
    },
    [targetContainerHeight]
  );

  const animatedContainerStyle = useAnimatedStyle(() => ({
    zIndex: activationProgress.value > 0 ? 1 : 0
  }));

  return {
    children: (
      <Animated.View
        style={[styles.container, animatedContainerStyle]}
        onLayout={measureContainer}>
        {children}
      </Animated.View>
    ),
    value: {
      animatedContainerHeight,
      itemDimensions,
      measureItem,
      measurementsCompleted,
      overrideItemDimensions,
      removeItem,
      targetContainerHeight,
      targetContainerWidth
    }
  };
});

const styles = StyleSheet.create({
  container: {
    width: '100%'
  }
});

export { MeasurementsProvider, useMeasurementsContext };
