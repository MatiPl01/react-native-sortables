import type { ReactNode } from 'react';
import { Fragment, useCallback, useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';

import type { PortalContextType, Vector } from '../../types';
import { createProvider } from '../utils';
import { PortalOutletProvider } from './PortalOutletProvider';

type PortalProviderProps = {
  children: ReactNode;
  enabled?: boolean;
};

const { PortalProvider, usePortalContext } = createProvider('Portal', {
  guarded: false
})<PortalProviderProps, PortalContextType>(({ children, enabled }) => {
  const [teleportedNodes, setTeleportedNodes] = useState<
    Record<string, React.ReactNode>
  >({});

  const activeItemAbsolutePosition = useSharedValue<null | Vector>(null);

  const teleport = useCallback((id: string, node: React.ReactNode) => {
    if (node) {
      setTeleportedNodes(prev => ({ ...prev, [id]: node }));
    } else {
      setTeleportedNodes(prev => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
    }
  }, []);

  return {
    children: (
      <Fragment>
        {children}
        <PortalOutletProvider>
          {Object.values(teleportedNodes).map((node, index) => (
            <Fragment key={index}>{node}</Fragment>
          ))}
        </PortalOutletProvider>
      </Fragment>
    ),
    enabled,
    value: {
      activeItemAbsolutePosition,
      teleport
    }
  };
});

export { PortalProvider, usePortalContext };
