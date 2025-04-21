import { useSharedValue } from 'react-native-reanimated';

import type { ChildrenProps, InterDragContextType, Vector } from '../../types';
import { createProvider } from '../utils';
import { ActiveItemValuesProvider } from './ActiveItemValuesProvider';

const { InterDragProvider, useInterDragContext } = createProvider('InterDrag', {
  guarded: false
})<ChildrenProps, InterDragContextType>(({ children }) => {
  const currentContainerId = useSharedValue<null | number>(null);
  const activeItemTriggerOriginAbsolutePosition = useSharedValue<Vector | null>(
    null
  );

  return {
    children: <ActiveItemValuesProvider>{children}</ActiveItemValuesProvider>,
    value: {
      activeItemTriggerOriginAbsolutePosition,
      currentContainerId
    }
  };
});

export { InterDragProvider, useInterDragContext };
