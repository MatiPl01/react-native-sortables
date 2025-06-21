import type { PropsWithChildren } from 'react';

import { createProvider } from '../utils';
import { PortalProvider, usePortalContext } from './PortalProvider';

type MultiZoneProviderProps = PropsWithChildren<{}>;

type MultiZoneContextType = {};

const { MultiZoneProvider, useMultiZoneContext } = createProvider('MultiZone', {
  guarded: false
})<MultiZoneProviderProps, MultiZoneContextType>(({ children }) => {
  const hasPortal = !!usePortalContext();

  return {
    children: hasPortal ? (
      children
    ) : (
      <PortalProvider>{children}</PortalProvider>
    ),
    value: {}
  };
});

export { MultiZoneProvider, useMultiZoneContext };
