import { type PropsWithChildren } from 'react';
import { type SharedValue, useSharedValue } from 'react-native-reanimated';

import type { Position } from '../../types';
import { createGuardedContext } from '../utils';

type DragContextType = {
  activeItemKey: SharedValue<null | string>;
  activationProgress: SharedValue<number>;
  activeItemPosition: SharedValue<Position>;
  enabled: boolean;
};

type DragProviderProps = PropsWithChildren<{
  enabled: boolean;
}>;

const { DragProvider, useDragContext } = createGuardedContext('Drag')<
  DragContextType,
  DragProviderProps
>(({ enabled }) => {
  const activeItemKey = useSharedValue<null | string>(null);
  const activationProgress = useSharedValue(0);
  const activeItemPosition = useSharedValue<Position>({ x: 0, y: 0 });

  return {
    value: {
      activationProgress,
      activeItemKey,
      activeItemPosition,
      enabled
    }
  };
});

export { DragProvider, useDragContext };
