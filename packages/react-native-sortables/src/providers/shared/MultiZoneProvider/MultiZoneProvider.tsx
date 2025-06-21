import type { PropsWithChildren } from 'react';

import { DebugOutletProvider, DebugProvider } from '../../../debug';
import { useAnimatableValue, useWarnOnPropChange } from '../../../hooks';
import type { Animatable, MultiZoneContextType } from '../../../types';
import { useMutableValue } from '../../../utils';
import { ContextProviderComposer, createProvider } from '../../utils';
import { PortalProvider, usePortalContext } from '../PortalProvider';

type MultiZoneProviderProps = PropsWithChildren<{
  debug?: boolean;
  minActivationDistance?: Animatable<number>;
}>;

const { MultiZoneProvider, useMultiZoneContext } = createProvider('MultiZone', {
  guarded: false
})<MultiZoneProviderProps, MultiZoneContextType>(({
  children,
  debug = false,
  minActivationDistance: minActivationDistance_ = 0
}) => {
  if (__DEV__) {
    useWarnOnPropChange('debug', debug);
  }

  const activeContainerId = useMutableValue<null | string>(null);
  const minActivationDistance = useAnimatableValue(minActivationDistance_);

  const providers = [
    // Provider used for layout debugging (can be used only in dev mode)
    __DEV__ && debug && <DebugProvider />,
    // Provider used to teleport the active item above other component
    // (added only if the multi-zone provider is not already nested inside
    // the portal provider)
    !usePortalContext() && <PortalProvider />
  ];

  return {
    children: (
      <ContextProviderComposer providers={providers}>
        {children}
        {debug && <DebugOutletProvider />}
      </ContextProviderComposer>
    ),
    value: {
      activeContainerId,
      minActivationDistance
    }
  };
});

export { MultiZoneProvider, useMultiZoneContext };
