import type { ReactNode } from 'react';
import { useSharedValue } from 'react-native-reanimated';

import type {
  ActiveItemValuesContextType,
  Dimensions,
  Vector
} from '../../types';
import { DragActivationState } from '../../types';
import { createProvider } from '../utils';

type ActiveItemValuesProviderProps = {
  children?: ReactNode;
};

const { ActiveItemValuesProvider, useActiveItemValuesContext } = createProvider(
  'ActiveItemValues'
)<ActiveItemValuesProviderProps, ActiveItemValuesContextType>(() => {
  // POSITIONS
  const touchPosition = useSharedValue<null | Vector>(null);
  const activeItemPosition = useSharedValue<null | Vector>(null);

  // DIMENSIONS
  const activeItemDimensions = useSharedValue<Dimensions | null>(null);

  // DRAG STATE
  const activeItemKey = useSharedValue<null | string>(null);
  const prevActiveItemKey = useSharedValue<null | string>(null);
  const activationState = useSharedValue(DragActivationState.INACTIVE);
  const activeAnimationProgress = useSharedValue(0);
  const inactiveAnimationProgress = useSharedValue(0);
  const activeItemDropped = useSharedValue(true);

  return {
    value: {
      activationState,
      activeAnimationProgress,
      activeItemDimensions,
      activeItemDropped,
      activeItemKey,
      activeItemPosition,
      inactiveAnimationProgress,
      prevActiveItemKey,
      touchPosition
    }
  };
});

export { ActiveItemValuesProvider, useActiveItemValuesContext };
