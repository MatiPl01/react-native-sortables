import type { ReactNode } from 'react';

import type {
  ActiveItemValuesContextType,
  Dimensions,
  Vector
} from '../../types';
import { DragActivationState } from '../../types';
import { useMutableValue } from '../../utils';
import { createProvider } from '../utils';

type ActiveItemValuesProviderProps = {
  children?: ReactNode;
};

const { ActiveItemValuesProvider, useActiveItemValuesContext } = createProvider(
  'ActiveItemValues'
)<ActiveItemValuesProviderProps, ActiveItemValuesContextType>(() => {
  // POSITIONS
  const touchPosition = useMutableValue<null | Vector>(null);
  const activeItemPosition = useMutableValue<null | Vector>(null);

  // DIMENSIONS
  const activeItemDimensions = useMutableValue<Dimensions | null>(null);

  // DRAG STATE
  const activeItemKey = useMutableValue<null | string>(null);
  const prevActiveItemKey = useMutableValue<null | string>(null);
  const activationState = useMutableValue(DragActivationState.INACTIVE);
  const activeAnimationProgress = useMutableValue(0);
  const inactiveAnimationProgress = useMutableValue(0);
  const activeItemDropped = useMutableValue(true);

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
