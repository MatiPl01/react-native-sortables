import { type PropsWithChildren, useCallback } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { StyleSheet } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated';

import { useUICallback } from '../../hooks';
import type { Dimensions } from '../../types';
import { createGuardedContext } from '../utils';
import { useDragContext } from './DragProvider';

type MeasurementsContextType = {
  initialMeasurementsCompleted: SharedValue<boolean>;
  itemDimensions: SharedValue<Record<string, Dimensions>>;
  overrideItemDimensions: SharedValue<Record<string, Partial<Dimensions>>>;
  containerHeight: SharedValue<number>;
  containerWidth: SharedValue<number>;
  measureItem: (key: string, dimensions: Dimensions) => void;
  removeItem: (key: string) => void;
};

type MeasurementsProviderProps = PropsWithChildren<{
  itemsCount: number;
}>;

const { MeasurementsProvider, useMeasurementsContext } = createGuardedContext(
  'Measurements'
)<MeasurementsContextType, MeasurementsProviderProps>(({
  children,
  itemsCount
}) => {
  const { activationProgress } = useDragContext();

  const measuredItemsCount = useSharedValue(0);

  const initialMeasurementsCompleted = useSharedValue(false);
  const itemDimensions = useSharedValue<Record<string, Dimensions>>({});
  const overrideItemDimensions = useSharedValue<
    Record<string, Partial<Dimensions>>
  >({});

  const containerWidth = useSharedValue(-1);
  const containerHeight = useSharedValue(-1);

  const measureItem = useUICallback((key: string, dimensions: Dimensions) => {
    'worklet';
    itemDimensions.value[key] = dimensions;
    measuredItemsCount.value += 1;
    // Update the array of item dimensions only after all items have been measured
    // to reduce the number of times animated reactions are triggered
    if (measuredItemsCount.value === itemsCount) {
      initialMeasurementsCompleted.value = true;
      itemDimensions.value = { ...itemDimensions.value };
    }
  });

  const removeItem = useUICallback((key: string) => {
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
      containerHeight,
      containerWidth,
      initialMeasurementsCompleted,
      itemDimensions,
      measureItem,
      overrideItemDimensions,
      removeItem
    }
  };
});

const styles = StyleSheet.create({
  container: {
    width: '100%'
  }
});

export { MeasurementsProvider, useMeasurementsContext };
