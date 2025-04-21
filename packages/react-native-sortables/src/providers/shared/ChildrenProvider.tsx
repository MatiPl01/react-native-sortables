import type { ReactNode } from 'react';

import { createProvider } from '../utils';

type ChildrenProviderProps = {
  childrenArray: Array<ReactNode>;
};

const { ChildrenProvider, useChildrenContext } = createProvider(
  'Children'
)<ChildrenProviderProps>(() => {});

export { ChildrenProvider, useChildrenContext };
