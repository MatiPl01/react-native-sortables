import type { ChildrenProps, EmptyRecord } from '../../types';
import { createProvider } from '../utils';
import { ActiveItemValuesProvider } from './ActiveItemValuesProvider';

const { InterDragProvider, useInterDragContext } = createProvider('InterDrag', {
  guarded: false
})<ChildrenProps, EmptyRecord>(({ children }) => ({
  children: <ActiveItemValuesProvider>{children}</ActiveItemValuesProvider>,
  value: {}
}));

export { InterDragProvider, useInterDragContext };
