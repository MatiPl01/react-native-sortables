import type { ReactNode } from 'react';
import { Fragment, useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAnimatedRef, useSharedValue } from 'react-native-reanimated';

import type { PortalContextType, Vector } from '../../types';
import { createProvider } from '../utils';

type PortalProviderProps = {
  children: ReactNode;
};

type Subscriber = (isTeleported: boolean) => void;

const { PortalProvider, usePortalContext } = createProvider('Portal', {
  guarded: false
})<PortalProviderProps, PortalContextType>(({ children }) => {
  const portalOutletRef = useAnimatedRef<View>();
  const subscribersRef = useRef<Record<string, Set<Subscriber>>>({});
  const activeItemAbsolutePosition = useSharedValue<Vector | null>(null);
  const [teleportedNodes, setTeleportedNodes] = useState<
    Record<string, React.ReactNode>
  >({});

  const notifySubscribers = useCallback(
    (itemKey: string, isTeleported: boolean) => {
      // Schedule for the next render
      setTimeout(() => {
        subscribersRef.current[itemKey]?.forEach(callback =>
          callback(isTeleported)
        );
      }, 0);
    },
    []
  );

  const teleport = useCallback(
    (itemKey: string, node: React.ReactNode) => {
      console.log('> teleport', itemKey, !!node);
      if (node) {
        setTeleportedNodes(prev => {
          const newState = { ...prev, [itemKey]: node };
          notifySubscribers(itemKey, true);
          return newState;
        });
      } else {
        setTeleportedNodes(prev => {
          if (!prev[itemKey]) return prev;
          const newState = { ...prev };
          delete newState[itemKey];
          notifySubscribers(itemKey, false);
          return newState;
        });
      }
    },
    [notifySubscribers]
  );

  const subscribe = useCallback((itemKey: string, callback: Subscriber) => {
    if (!subscribersRef.current[itemKey]) {
      subscribersRef.current[itemKey] = new Set();
    }
    subscribersRef.current[itemKey].add(callback);

    return () => {
      subscribersRef.current[itemKey]?.delete(callback);
    };
  }, []);

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
    value: { activeItemAbsolutePosition, portalOutletRef, subscribe, teleport }
  };
});

export { PortalProvider, usePortalContext };
