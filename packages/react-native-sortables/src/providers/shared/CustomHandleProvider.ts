import type { ReactNode } from 'react';
import { useSharedValue } from 'react-native-reanimated';

import type { CustomHandleContextType, Dimensions, Vector } from '../../types';
import { createProvider } from '../utils';

type CustomHandleProviderProps = {
  children?: ReactNode;
};

const { CustomHandleProvider, useCustomHandleContext } = createProvider(
  'CustomHandle',
  { guarded: false }
)<CustomHandleProviderProps, CustomHandleContextType>(() => {
  const activeHandleOffset = useSharedValue<Vector | null>(null);
  const activeHandleDimensions = useSharedValue<Dimensions | null>(null);
  const fixedItemKeys = useSharedValue<Record<string, boolean>>({});

  return {
    value: {
      activeHandleDimensions,
      activeHandleOffset,
      fixedItemKeys
    }
  };
});

export { CustomHandleProvider, useCustomHandleContext };
