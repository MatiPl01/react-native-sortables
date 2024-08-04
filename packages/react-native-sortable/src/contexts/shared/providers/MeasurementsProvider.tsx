import { type PropsWithChildren, useCallback } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { StyleSheet } from 'react-native';
import Animated, {
  type AnimatedRef,
  measure,
  runOnUI,
  type SharedValue,
  useAnimatedReaction,
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
  touchedItemDimensions: SharedValue<Dimensions | null>;
  overrideItemDimensions: SharedValue<Record<string, Partial<Dimensions>>>;
  containerHeight: SharedValue<number>;
  containerWidth: SharedValue<number>;
  measureAllItems: () => void;
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

  const touchedItemDimensions = useSharedValue<Dimensions | null>(null);
  const itemDimensions = useSharedValue<Record<string, Dimensions>>({});
  const overrideItemDimensions = useSharedValue<
    Record<string, Partial<Dimensions>>
  >({});
  const containerWidth = useSharedValue(-1);
  const containerHeight = useSharedValue(-1);

  const handleItemMeasurement = useCallback(
    (key: string, ref: AnimatedRef<Animated.View>): boolean => {
      'worklet';
      const dimensions = measure(ref);
      if (
        !dimensions ||
        (itemDimensions.value[key] &&
          !areDimensionsDifferent(itemDimensions.value[key], dimensions))
      ) {
        return false;
      }

      if (!itemDimensions.value[key]) {
        measuredItemsCount.value += 1;
      }

      itemDimensions.value[key] = dimensions;
      if (touchedItemKey.value === key) {
        touchedItemDimensions.value = dimensions;
      }

      return true;
    },
    [itemDimensions, measuredItemsCount, touchedItemDimensions, touchedItemKey]
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
          console.log('schedule update 2');
          clearAnimatedTimeout(updateTimeoutId.value);
          updateTimeoutId.value = setAnimatedTimeout(
            () => {
              console.log('update 2');
              itemDimensions.value = { ...itemDimensions.value };
              initialMeasurementsCompleted.value = true;
              updateTimeoutId.value = -1;
            },
            initialMeasurementsCompleted.value ? 200 : 100
          );
        }
      })();
    }
  );

  const measureAllItems = useCallback(() => {
    'worklet';
    console.log('measureAllItems');
    let isUpdated = false;
    for (const key in itemRefs.value) {
      isUpdated = handleItemMeasurement(key, itemRefs.value[key]!) || isUpdated;
    }
    if (isUpdated) {
      itemDimensions.value = { ...itemDimensions.value };
    }
  }, [handleItemMeasurement, itemDimensions, itemRefs]);

  useAnimatedReaction(
    () => itemDimensions.value,
    () => {
      console.log('Item dimensions updated:', itemDimensions.value);
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
      touchedItemDimensions.value = itemDimensions.value[key] ?? null;
    },
    [touchedItemDimensions, itemDimensions]
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
      measureAllItems,
      measureItem,
      overrideItemDimensions,
      removeItem,
      touchedItemDimensions,
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
