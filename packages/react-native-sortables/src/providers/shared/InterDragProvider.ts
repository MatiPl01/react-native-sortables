import type { PropsWithChildren } from 'react';

import type { InterDragContextType } from '../../types';
import { createProvider } from '../utils';

type InterDragProviderProps = PropsWithChildren<{
  // TODO
}>;

const { InterDragProvider, useInterDragContext } = createProvider('InterDrag', {
  guarded: false
})<InterDragProviderProps, InterDragContextType>(() => {
  return { value: {} };
});

export { InterDragProvider, useInterDragContext };
