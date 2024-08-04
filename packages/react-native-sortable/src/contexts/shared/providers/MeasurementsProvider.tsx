import { type PropsWithChildren, useCallback } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { StyleSheet } from 'react-native';
import Animated, {
  type AnimatedRef,
  measure,
  runOnUI,
  type SharedValue,
  useSharedValue
} from 'react-native-reanimated';

import { useStableCallback } from '../../../hooks';
import type { Dimensions } from '../../../types';
import {
  type AnimatedTimeoutID,
  areDimensionsDifferent,
  clearAnimatedTimeout,
  setAnimatedTimeout
} from '../../../utils';
import { createEnhancedContext } from '../../utils';
import { useDragContext } from './DragProvider';

type MeasurementsContextType = {
  initialMeasurementsCompleted: SharedValue<boolean>;
  itemDimensions: SharedValue<Record<string, Dimensions>>;
  touchedItemWidth: SharedValue<number>;
  touchedItemHeight: SharedValue<number>;
  overrideItemDimensions: SharedValue<Record<string, Partial<Dimensions>>>;
  containerHeight: SharedValue<number>;
  containerWidth: SharedValue<number>;
  measureItem: (key: string, ref: AnimatedRef<Animated.View>) => void;
  removeItem: (key: string) => void;
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
  const initialMeasurementsCompleted = useSharedValue(false);
  const updateTimeoutId = useSharedValue<AnimatedTimeoutID>(-1);
  const itemRefs = useSharedValue<Record<string, AnimatedRef<Animated.View>>>(
    {}
  );

  const touchedItemWidth = useSharedValue<number>(-1);
  const touchedItemHeight = useSharedValue<number>(-1);
  const itemDimensions = useSharedValue<Record<string, Dimensions>>({});
  const overrideItemDimensions = useSharedValue<
    Record<string, Partial<Dimensions>>
  >({});
  const containerWidth = useSharedValue(-1);
  const containerHeight = useSharedValue(-1);

  const handleItemMeasurement = useCallback(
    (key: string, ref: AnimatedRef<Animated.View>): boolean => {
      'worklet';
      console.log('>>> handleItemMeasurement', key);
      const dimensions = measure(ref);
      const storedDimensions = itemDimensions.value[key];
      if (
        !dimensions ||
        (storedDimensions &&
          !areDimensionsDifferent(storedDimensions, dimensions, 0.1))
      ) {
        return false;
      }

      if (!itemDimensions.value[key]) {
        measuredItemsCount.value += 1;
      }

      itemDimensions.value[key] = dimensions;
      if (touchedItemKey.value === key) {
        touchedItemWidth.value = dimensions.width;
        touchedItemHeight.value = dimensions.height;
      }

      return true;
    },
    [
      itemDimensions,
      measuredItemsCount,
      touchedItemWidth,
      touchedItemHeight,
      touchedItemKey
    ]
  );

  const measureItem = useStableCallback(
    (key: string, ref: AnimatedRef<Animated.View>) => {
      runOnUI(() => {
        itemRefs.value[key] = ref;
        const isUpdated = handleItemMeasurement(key, ref);
        if (!isUpdated) {
          return;
        }

        // Update the array of item dimensions only after all items have been
        // measured to reduce the number of times animated reactions are triggered
        if (measuredItemsCount.value === itemsCount) {
          clearAnimatedTimeout(updateTimeoutId.value);
          updateTimeoutId.value = setAnimatedTimeout(() => {
            itemDimensions.value = { ...itemDimensions.value };
            initialMeasurementsCompleted.value = true;
            updateTimeoutId.value = -1;
          }, 100);
        }
      })();
    }
  );

  const removeItem = useStableCallback((key: string) => {
    'worklet';
    runOnUI(() => {
      delete itemDimensions.value[key];
      measuredItemsCount.value = Math.max(0, measuredItemsCount.value - 1);
    })();
  });

  const measureContainer = useCallback(
    ({
      nativeEvent: {
        layout: { width }
      }
    }: LayoutChangeEvent) => {
      containerWidth.value = width;
    },
    [containerWidth]
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

  return {
    children: (
      <Animated.View style={styles.container} onLayout={measureContainer}>
        {children}
      </Animated.View>
    ),
    value: {
      containerHeight,
      containerWidth,
      initialMeasurementsCompleted,
      itemDimensions,
      measureItem,
      overrideItemDimensions,
      removeItem,
      touchedItemHeight,
      touchedItemWidth,
      updateTouchedItemDimensions
    }
  };
});

const styles = StyleSheet.create({
  container: {
    width: '100%'
  }
});

export { MeasurementsProvider, useMeasurementsContext };
