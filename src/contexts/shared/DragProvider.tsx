import type { PropsWithChildren } from 'react';

import { createGuardedContext } from '../utils';

type DragContextType = {};

type DragProviderProps = PropsWithChildren<{
  enabled?: boolean;
}>;

const { DragProvider, useDragContext } = createGuardedContext('Drag')<
  DragContextType,
  DragProviderProps
>(() => {
  return {
    value: {}
  };
});

export { DragProvider, useDragContext };
