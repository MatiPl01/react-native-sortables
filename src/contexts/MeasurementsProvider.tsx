import { useCallback, useMemo, type PropsWithChildren } from 'react';
import type { Dimensions } from 'react-native';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';

import { createGuardedContext } from './utils';

type MeasurementsContextType = {
  itemDimensions: SharedValue<Record<string, Dimensions>>;
  measureItem: (key: string, dimensions: Dimensions) => void;
  removeItem: (key: string) => void;
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

  const measureItem = useCallback((key: string, dimensions: Dimensions) => {

  }, []);

  const removeItem = useCallback((key: string) => {}, []);

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
