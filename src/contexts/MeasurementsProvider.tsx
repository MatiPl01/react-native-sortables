import type { PropsWithChildren } from 'react';
import { useMemo } from 'react';
import {
  type SharedValue,
  useAnimatedReaction,
  useSharedValue
} from 'react-native-reanimated';

import { useUICallback } from '../hooks';
import type { Dimensions } from '../types';
import { createGuardedContext } from './utils';

type MeasurementsContextType = {
  initialMeasurementsCompleted: SharedValue<boolean>;
  itemDimensions: SharedValue<Record<string, Dimensions>>;
  measureItem: (id: string, dimensions: Dimensions) => void;
  removeItem: (id: string) => void;
};

type MeasurementsProviderProps = PropsWithChildren<{
  itemsCount: number;
}>;

const { MeasurementsProvider, useMeasurementsContext } = createGuardedContext(
  'Measurements'
)<MeasurementsContextType, MeasurementsProviderProps>(({ itemsCount }) => {
  const initialMeasurementsCompleted = useSharedValue(false);
  const measuredItemsCount = useSharedValue(0);

  const itemDimensions = useSharedValue<Record<string, Dimensions>>({});

  const measureItem = useUICallback((id: string, dimensions: Dimensions) => {
    'worklet';
    itemDimensions.value[id] = dimensions;
    measuredItemsCount.value += 1;
    // Update the array of item dimensions only after all items have been measured
    // to reduce the number of times animated reactions are triggered
    if (measuredItemsCount.value === itemsCount) {
      initialMeasurementsCompleted.value = true;
      itemDimensions.value = { ...itemDimensions.value };
    }
  });

  const removeItem = useUICallback((id: string) => {
    'worklet';
    delete itemDimensions.value[id];
    measuredItemsCount.value = Math.max(0, measuredItemsCount.value - 1);
  });

  useAnimatedReaction(
    () => initialMeasurementsCompleted.value,
    completed => {
      console.log('Initial measurements completed:', completed);
    }
  );

  useAnimatedReaction(
    () => itemDimensions.value,
    dimensions => {
      console.log('Item dimensions:', dimensions);
    }
  );

  return useMemo<MeasurementsContextType>(
    () => ({
      initialMeasurementsCompleted,
      itemDimensions,
      measureItem,
      removeItem
    }),
    [initialMeasurementsCompleted, itemDimensions, measureItem, removeItem]
  );
});

export { MeasurementsProvider, useMeasurementsContext };
