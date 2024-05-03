import type { PropsWithChildren } from 'react';

import { createGuardedContext } from '../../utils';

type FlexLayoutContextType = {};

type FlexLayoutProviderProps = PropsWithChildren<{}>;

const { FlexLayoutProvider, useFlexLayoutContext } = createGuardedContext(
  'FlexLayout'
)<FlexLayoutContextType, FlexLayoutProviderProps>(() => {
  return {};
});

export { FlexLayoutProvider, useFlexLayoutContext };
