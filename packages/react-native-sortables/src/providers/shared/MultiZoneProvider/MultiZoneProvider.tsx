import type { PropsWithChildren } from 'react';

import { useAnimatableValue } from '../../../hooks';
import type { Animatable, MultiZoneContextType } from '../../../types';
import { useMutableValue } from '../../../utils';
import { createProvider } from '../../utils';
import { PortalProvider, usePortalContext } from '../PortalProvider';

type MultiZoneProviderProps = PropsWithChildren<{
  minActivationDistance?: Animatable<number>;
}>;

const { MultiZoneProvider, useMultiZoneContext } = createProvider('MultiZone', {
  guarded: false
})<MultiZoneProviderProps, MultiZoneContextType>(({
  children,
  minActivationDistance: minActivationDistance_ = 0
}) => {
  const activeContainerId = useMutableValue<null | string>(null);
  const minActivationDistance = useAnimatableValue(minActivationDistance_);

  return {
    children: !usePortalContext() ? (
      <PortalProvider>{children}</PortalProvider>
    ) : (
      children
    ),
    value: {
      activeContainerId,
      minActivationDistance
    }
  };
});

export { MultiZoneProvider, useMultiZoneContext };
