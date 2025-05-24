import type { ReactNode } from 'react';
import type { MeasuredDimensions } from 'react-native-reanimated';
import { useSharedValue } from 'react-native-reanimated';

import { useUIStableCallback } from '../../hooks';
import type { CustomHandleContextType } from '../../types';
import { useAnimatedDebounce } from '../../utils';
import { createProvider } from '../utils';

type CustomHandleProviderProps = {
  children?: ReactNode;
};

const { CustomHandleProvider, useCustomHandleContext } = createProvider(
  'CustomHandle',
  { guarded: false }
)<CustomHandleProviderProps, CustomHandleContextType>(() => {
  const activeHandleMeasurements = useSharedValue<MeasuredDimensions | null>(
    null
  );
  const fixedItemKeys = useSharedValue<Record<string, boolean>>({});
  const debounce = useAnimatedDebounce();

  const makeItemFixed = useUIStableCallback((key: string) => {
    'worklet';
    fixedItemKeys.value[key] = true;
    debounce(fixedItemKeys.modify, 100);
  });

  const removeFixedItem = useUIStableCallback((key: string) => {
    'worklet';
    delete fixedItemKeys.value[key];
    debounce(fixedItemKeys.modify, 100);
  });

  return {
    value: {
      activeHandleMeasurements,
      fixedItemKeys,
      makeItemFixed,
      removeFixedItem
    }
  };
});

export { CustomHandleProvider, useCustomHandleContext };
