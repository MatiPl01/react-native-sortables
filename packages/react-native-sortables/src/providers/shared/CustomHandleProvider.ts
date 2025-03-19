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
  const handleOffset = useSharedValue<Vector | null>(null);
  const handleDimensions = useSharedValue<Dimensions | null>(null);

  return {
    value: {
      handleDimensions,
      handleOffset
    }
  };
});

export { CustomHandleProvider, useCustomHandleContext };
