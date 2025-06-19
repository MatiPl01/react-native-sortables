import type { ReactNode } from 'react';
import { Fragment, useCallback, useRef, useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';

import type {
  PortalContextType,
  PortalSubscription,
  Vector
} from '../../types';
import { createProvider } from '../utils';
import { PortalOutlet } from './PortalOutletProvider';

type PortalProviderProps = {
  children: ReactNode;
  enabled?: boolean;
};

const { PortalProvider, usePortalContext } = createProvider('Portal', {
  guarded: false
})<PortalProviderProps, PortalContextType>(({ children, enabled }) => {
  const subscribersRef = useRef<Record<string, Set<PortalSubscription>>>({});
  const [teleportedNodes, setTeleportedNodes] = useState<
    Record<string, React.ReactNode>
  >({});

  const activeItemAbsolutePosition = useSharedValue<null | Vector>(null);

  const notifySubscribers = useCallback((id: string, isTeleported: boolean) => {
    subscribersRef.current[id]?.forEach(callback => {
      callback(isTeleported);
    });
  }, []);

  const subscribe = useCallback((id: string, callback: PortalSubscription) => {
    subscribersRef.current[id] ??= new Set();
    subscribersRef.current[id]?.add(callback);
    return () => {
      subscribersRef.current[id]?.delete(callback);
    };
  }, []);

  const teleport = useCallback(
    (id: string, node: React.ReactNode) => {
      if (node) {
        setTeleportedNodes(prev => ({ ...prev, [id]: node }));
        notifySubscribers(id, true);
      } else {
        setTeleportedNodes(prev => {
          const { [id]: _, ...rest } = prev;
          return rest;
        });
        notifySubscribers(id, false);
      }
    },
    [notifySubscribers]
  );

  return {
    children: (
      <Fragment>
        {children}
        <PortalOutlet>
          {Object.values(teleportedNodes).map((node, index) => (
            <Fragment key={index}>{node}</Fragment>
          ))}
        </PortalOutlet>
      </Fragment>
    ),
    enabled,
    value: {
      activeItemAbsolutePosition,
      subscribe,
      teleport
    }
  };
});

export { PortalProvider, usePortalContext };
