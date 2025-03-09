import { Fragment, type ReactNode, useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAnimatedRef } from 'react-native-reanimated';

import type { PortalContextType } from '../../types';
import { createProvider } from '../utils';

type PortalProviderProps = {
  children: ReactNode;
};

const { PortalProvider, usePortalContext } = createProvider('Portal', {
  guarded: false
})<PortalProviderProps, PortalContextType>(({ children }) => {
  const portalOutletRef = useAnimatedRef<View>();
  const [teleportedNodes, setTeleportedNodes] = useState<
    Record<string, ReactNode>
  >({});

  const teleport = useCallback((itemKey: string, node: ReactNode) => {
    if (node === null) {
      setTeleportedNodes(prev => {
        if (!prev[itemKey]) {
          return prev;
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [itemKey]: _, ...rest } = prev;
        return rest;
      });
    } else {
      setTeleportedNodes(prev => ({ ...prev, [itemKey]: node }));
    }
  }, []);

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
    value: {
      portalOutletRef,
      teleport
    }
  };
});

export { PortalProvider, usePortalContext };
