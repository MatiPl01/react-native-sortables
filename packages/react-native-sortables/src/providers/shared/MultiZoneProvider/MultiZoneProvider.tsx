import type { PropsWithChildren } from 'react';

import type { Animatable } from '../../../integrations/reanimated';
import {
  useAnimatableValue,
  useMutableValue
} from '../../../integrations/reanimated';
import type { MultiZoneContextType } from '../../../types';
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
