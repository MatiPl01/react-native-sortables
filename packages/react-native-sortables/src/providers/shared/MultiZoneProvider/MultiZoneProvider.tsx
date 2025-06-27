import type { PropsWithChildren } from 'react';

import type { Animatable } from '../../../integrations/reanimated';
import { useMutableValue } from '../../../integrations/reanimated';
import type { MultiZoneContextType } from '../../../types';
import { createProvider } from '../../utils';
import { PortalProvider } from '../PortalProvider';

type MultiZoneProviderProps = PropsWithChildren<{
  minActivationDistance?: Animatable<number>;
}>;

const { MultiZoneProvider, useMultiZoneContext } = createProvider('MultiZone', {
  guarded: false
})<MultiZoneProviderProps, MultiZoneContextType>(({ children }) => {
  const activeContainerId = useMutableValue<null | string>(null);

  return {
    children: (
      <PortalProvider propagateToOuterPortal>{children}</PortalProvider>
    ),
    value: {
      activeContainerId
    }
  };
});

export { MultiZoneProvider, useMultiZoneContext };
