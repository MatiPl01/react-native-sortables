import { useCallback, useMemo, type PropsWithChildren } from 'react';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';

import { createGuardedContext } from './utils';
import { Dimensions } from '../types';

type MeasurementsContextType = {
  itemDimensions: SharedValue<Record<string, Dimensions>>;
  measureItem: (id: string, dimensions: Dimensions) => void;
  removeItem: (id: string) => void;
};

type MeasurementsProviderProps = PropsWithChildren<{}>;

const {
  MeasurementsProvider,
  useMeasurementsContext
} = createGuardedContext('Measurements')<
  MeasurementsContextType,
  MeasurementsProviderProps
>(() => {
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
    []
  );
});

export { MeasurementsProvider, useMeasurementsContext };
