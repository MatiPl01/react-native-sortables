import { useSharedValue } from 'react-native-reanimated';

import { useUIStableCallback } from '../../hooks';
import type {
  ChildrenProps,
  CustomHandleContextType,
  Dimensions,
  Vector
} from '../../types';
import { useAnimatedDebounce } from '../../utils';
import { createProvider } from '../utils';

const { CustomHandleProvider, useCustomHandleContext } = createProvider(
  'CustomHandle',
  { guarded: false }
)<ChildrenProps, CustomHandleContextType>(() => {
  const activeHandleOffset = useSharedValue<Vector | null>(null);
  const activeHandleDimensions = useSharedValue<Dimensions | null>(null);
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
      activeHandleDimensions,
      activeHandleOffset,
      fixedItemKeys,
      makeItemFixed,
      removeFixedItem
    }
  };
});

export { CustomHandleProvider, useCustomHandleContext };
