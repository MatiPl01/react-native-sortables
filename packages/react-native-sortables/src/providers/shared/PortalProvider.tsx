import { Fragment, type ReactNode, useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAnimatedRef, useSharedValue } from 'react-native-reanimated';

import type { PortalContextType, Vector } from '../../types';
import { createProvider } from '../utils';

type PortalProviderProps = {
  children: ReactNode;
};

const { PortalProvider, usePortalContext } = createProvider('Portal', {
  guarded: false
})<PortalProviderProps, PortalContextType>(({ children }) => {
  const portalOutletRef = useAnimatedRef<View>();
  const activeItemAbsolutePosition = useSharedValue<Vector | null>(null);
  const [teleportedNodes, setTeleportedNodes] = useState<
    Record<string, ReactNode>
  >({});

  const addTeleportedNode = useCallback((itemKey: string, node: ReactNode) => {
    setTeleportedNodes(prev => ({ ...prev, [itemKey]: node }));
  }, []);

  const removeTeleportedNode = useCallback((itemKey: string) => {
    setTeleportedNodes(prev => {
      if (!prev[itemKey]) {
        return prev;
      }

      delete prev[itemKey];
      return { ...prev };
    });
  }, []);

  const teleport = useCallback(
    (itemKey: string, node: ReactNode) => {
      if (node) {
        addTeleportedNode(itemKey, node);
      } else {
        removeTeleportedNode(itemKey);
      }

      return () => removeTeleportedNode(itemKey);
    },
    [addTeleportedNode, removeTeleportedNode]
  );

  return {
    children: (
      <>
        {children}
        <View ref={portalOutletRef} style={StyleSheet.absoluteFill}>
          {Object.entries(teleportedNodes).map(([itemKey, node]) => (
            <Fragment key={itemKey}>{node}</Fragment>
          ))}
        </View>
      </>
    ),
    value: { activeItemAbsolutePosition, portalOutletRef, teleport }
  };
});

export { PortalProvider, usePortalContext };
