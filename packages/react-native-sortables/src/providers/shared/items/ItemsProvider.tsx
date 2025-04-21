import { useMemo, type ReactNode } from 'react';

import { createProvider } from '../../utils';
import { createStore } from '../../../store';
import { ChildrenContextType } from '../../../types';

type ChildrenProviderProps = {
  childrenArray: Array<ReactNode>;
};

const { ChildrenProvider, useChildrenContext } = createProvider('Children')<
  ChildrenProviderProps,
  ChildrenContextType
>(() => {
  const store = useMemo(() => createStore(), []);

  return {
    value: {}
  };
});

export { ChildrenProvider, useChildrenContext };
