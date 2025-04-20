import { useSharedValue } from 'react-native-reanimated';

import type {
  ActiveItemValuesContextType,
  ChildrenProps,
  Dimensions,
  Vector
} from '../../types';
import { DragActivationState } from '../../types';
import { createProvider } from '../utils';

const { ActiveItemValuesProvider, useActiveItemValuesContext } = createProvider(
  'ActiveItemValues'
)<ChildrenProps, ActiveItemValuesContextType>(() => {
  // POSITIONS
  const activeItemAbsolutePosition = useSharedValue<Vector | null>(null);
  const activeItemTriggerOriginPosition = useSharedValue<Vector | null>(null);
  const activeItemPosition = useSharedValue<Vector | null>(null);

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
      activeItemAbsolutePosition,
      activeItemDimensions,
      activeItemDropped,
      activeItemKey,
      activeItemPosition,
      activeItemTriggerOriginPosition,
      inactiveAnimationProgress,
      prevActiveItemKey
    }
  };
});

export { ActiveItemValuesProvider, useActiveItemValuesContext };
