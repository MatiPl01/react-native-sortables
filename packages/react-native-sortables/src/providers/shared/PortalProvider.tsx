import type { ReactNode } from 'react';
import { Fragment, useCallback, useRef, useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';

import type {
  PortalContextType,
  PortalSubscription,
  Vector
} from '../../types';
import { createProvider } from '../utils';
import { PortalOutletProvider } from './PortalOutletProvider';

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

  const activeItemAbsolutePosition = useSharedValue<Vector | null>(null);

  const teleport = useCallback((id: string, node: React.ReactNode) => {
    if (node) {
      setTeleportedNodes(prev => {
        const newState = { ...prev, [id]: node };
        return newState;
      });
    } else {
      setTeleportedNodes(prev => {
        if (!prev[id]) return prev;
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    }
  }, []);

  const subscribe = useCallback((id: string, callback: PortalSubscription) => {
    if (!subscribersRef.current[id]) {
      subscribersRef.current[id] = new Set();
    }
    subscribersRef.current[id]?.add(callback);
    return () => {
      subscribersRef.current[id]?.delete(callback);
    };
  }, []);

  const notifySubscribers = useCallback((id: string, isTeleported: boolean) => {
    subscribersRef.current[id]?.forEach(callback => {
      callback(isTeleported);
    });
  }, []);

  const notifyRendered = useCallback(
    (id: string) => {
      notifySubscribers(id, true);
    },
    [notifySubscribers]
  );

  return {
    children: (
      <Fragment>
        {children}
        <PortalOutletProvider>
          {Object.entries(teleportedNodes).map(([key, node]) => (
            <Fragment key={key}>{node}</Fragment>
          ))}
        </PortalOutletProvider>
      </Fragment>
    ),
    enabled,
    value: {
      activeItemAbsolutePosition,
      notifyRendered,
      subscribe,
      teleport
    }
  };
});

export { PortalProvider, usePortalContext };
