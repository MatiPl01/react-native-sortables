import type { PropsWithChildren } from 'react';
import { type SharedValue, useSharedValue } from 'react-native-reanimated';

import { useUICallback } from '../../hooks';
import type { Dimensions } from '../../types';
import { createGuardedContext } from '../utils';

type MeasurementsContextType = {
  initialMeasurementsCompleted: SharedValue<boolean>;
  itemDimensions: SharedValue<Record<string, Dimensions>>;
  measureItem: (key: string, dimensions: Dimensions) => void;
  removeItem: (key: string) => void;
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

  return {
    value: {
      initialMeasurementsCompleted,
      itemDimensions,
      measureItem,
      removeItem
    }
  };
});

export { MeasurementsProvider, useMeasurementsContext };
