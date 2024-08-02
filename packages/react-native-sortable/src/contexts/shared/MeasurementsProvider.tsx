import { type PropsWithChildren, useCallback } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { StyleSheet } from 'react-native';
import Animated, {
  type SharedValue,
  useSharedValue
} from 'react-native-reanimated';

import { useUIStableCallback } from '../../hooks';
import type { Dimensions } from '../../types';
import { createEnhancedContext } from '../utils';
import { useDragContext } from './DragProvider';

type MeasurementsContextType = {
  initialMeasurementsCompleted: SharedValue<boolean>;
  itemDimensions: SharedValue<Record<string, Dimensions>>;
  overrideItemDimensions: SharedValue<Record<string, Partial<Dimensions>>>;
  containerHeight: SharedValue<number>;
  containerWidth: SharedValue<number>;
  measureItem: (key: string, dimensions: Dimensions) => void;
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
  const { touchedItemDimensions, touchedItemKey } = useDragContext();

  const measuredItemsCount = useSharedValue(0);

  const initialMeasurementsCompleted = useSharedValue(false);
  const itemDimensions = useSharedValue<Record<string, Dimensions>>({});
  const overrideItemDimensions = useSharedValue<
    Record<string, Partial<Dimensions>>
  >({});

  const containerWidth = useSharedValue(-1);
  const containerHeight = useSharedValue(-1);

  const measureItem = useUIStableCallback(
    (key: string, dimensions: Dimensions) => {
      'worklet';
      itemDimensions.value[key] = dimensions;
      measuredItemsCount.value += 1;
      if (touchedItemKey.value === key) {
        touchedItemDimensions.value = dimensions;
      }
      // Update the array of item dimensions only after all items have been measured
      // to reduce the number of times animated reactions are triggered
      if (measuredItemsCount.value === itemsCount) {
        initialMeasurementsCompleted.value = true;
        itemDimensions.value = { ...itemDimensions.value };
      }
    }
  );

  const removeItem = useUIStableCallback((key: string) => {
    'worklet';
    delete itemDimensions.value[key];
    measuredItemsCount.value = Math.max(0, measuredItemsCount.value - 1);
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
      measureItem,
      overrideItemDimensions,
      removeItem,
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
