import type { ReactNode } from 'react';
import { Fragment, useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAnimatedRef, useSharedValue } from 'react-native-reanimated';

import type {
  PortalContextType,
  PortalSubscription,
  Vector
} from '../../types';
import { createProvider } from '../utils';

type PortalProviderProps = {
  children: ReactNode;
};

const { PortalProvider, usePortalContext } = createProvider('Portal', {
  guarded: false
})<PortalProviderProps, PortalContextType>(({ children }) => {
  const portalOutletRef = useAnimatedRef<View>();
  const subscribersRef = useRef<Record<string, Set<PortalSubscription>>>({});
  const activeItemAbsolutePosition = useSharedValue<Vector | null>(null);
  const [teleportedNodes, setTeleportedNodes] = useState<
    Record<string, React.ReactNode>
  >({});

  const teleport = useCallback((itemKey: string, node: React.ReactNode) => {
    if (node) {
      setTeleportedNodes(prev => {
        const newState = { ...prev, [itemKey]: node };
        return newState;
      });
    } else {
      setTeleportedNodes(prev => {
        if (!prev[itemKey]) return prev;
        const newState = { ...prev };
        delete newState[itemKey];
        return newState;
      });
    }
  }, []);

  const subscribe = useCallback(
    (itemKey: string, callback: PortalSubscription) => {
      if (!subscribersRef.current[itemKey]) {
        subscribersRef.current[itemKey] = new Set();
      }
      subscribersRef.current[itemKey].add(callback);
      return () => {
        subscribersRef.current[itemKey]?.delete(callback);
      };
    },
    []
  );

  const notifySubscribers = useCallback(
    (itemKey: string, isTeleported: boolean) => {
      subscribersRef.current[itemKey]?.forEach(callback =>
        callback(isTeleported)
      );
    },
    []
  );

  const notifyRendered = useCallback(
    (itemKey: string) => {
      notifySubscribers(itemKey, true);
    },
    [notifySubscribers]
  );

  return {
    children: (
      <>
        {children}
        <View ref={portalOutletRef} style={StyleSheet.absoluteFill}>
          {Object.entries(teleportedNodes).map(([key, node]) => (
            <Fragment key={key}>{node}</Fragment>
          ))}
        </View>
      </>
    ),
    value: {
      activeItemAbsolutePosition,
      notifyRendered,
      portalOutletRef,
      subscribe,
      teleport
    }
  };
});

export { PortalProvider, usePortalContext };
