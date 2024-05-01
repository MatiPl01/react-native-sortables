import { type ReactNode, useCallback, useMemo } from 'react';
import { type SharedValue, useSharedValue } from 'react-native-reanimated';

import type { Dimensions } from '../types/layout';
import { createGuardedContext } from './utils';

type MeasurementsContextType = {
  itemDimensions: SharedValue<Record<string, Dimensions>>;
  measureItem: (id: string, dimensions: Dimensions) => void;
  removeItem: (id: string) => void;
};

type MeasurementsProviderProps = { children: ReactNode };

const { MeasurementsProvider, useMeasurementsContext } = createGuardedContext(
  'Measurements'
)<MeasurementsContextType, MeasurementsProviderProps>(() => {
  const itemDimensions = useSharedValue<Record<string, Dimensions>>({});

  const measureItem = useCallback((id: string, dimensions: Dimensions) => {
    console.log('Measuring item', id, dimensions);
  }, []);

  const removeItem = useCallback((id: string) => {
    console.log('Removing item', id);
  }, []);

  return useMemo<MeasurementsContextType>(
    () => ({
      itemDimensions,
      measureItem,
      removeItem
    }),
    [itemDimensions, measureItem, removeItem]
  );
});

export { MeasurementsProvider, useMeasurementsContext };
