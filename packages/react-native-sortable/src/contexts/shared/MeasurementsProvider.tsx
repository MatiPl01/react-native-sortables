import { type PropsWithChildren, useCallback } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { View } from 'react-native';
import { type SharedValue, useSharedValue } from 'react-native-reanimated';

import { useUICallback } from '../../hooks';
import type { Dimensions } from '../../types';
import { createEnhancedContext } from '../utils';

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

const { MeasurementsProvider, useMeasurementsContext } = createEnhancedContext(
  'Measurements'
)<MeasurementsContextType, MeasurementsProviderProps>(({
  children,
  itemsCount
}) => {
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

  return {
    children: <View onLayout={measureContainer}>{children}</View>,
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

export { MeasurementsProvider, useMeasurementsContext };
