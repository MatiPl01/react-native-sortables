import type { PropsWithChildren, ReactNode } from 'react';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
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
    Record<string, { node: ReactNode; onRender?: () => void }>
  >({});

  const addTeleportedNode = useCallback(
    (itemKey: string, node: ReactNode, onRender?: () => void) => {
      setTeleportedNodes(prev => ({ ...prev, [itemKey]: { node, onRender } }));
    },
    []
  );

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
    (itemKey: string, node: ReactNode, onRender?: () => void) => {
      if (node) {
        addTeleportedNode(itemKey, node, onRender);
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
          {Object.entries(teleportedNodes).map(
            ([itemKey, { node, onRender }]) => (
              <TeleportedComponent key={itemKey} onRender={onRender}>
                {node}
              </TeleportedComponent>
            )
          )}
        </View>
      </>
    ),
    value: { activeItemAbsolutePosition, portalOutletRef, teleport }
  };
});

type TeleportedComponentProps = PropsWithChildren<{
  onRender?: () => void;
}>;

function TeleportedComponent({ children, onRender }: TeleportedComponentProps) {
  const isRenderedRef = useRef(false);

  useEffect(() => {
    if (isRenderedRef.current) {
      return;
    }

    isRenderedRef.current = true;
    console.log('call onRender');
    onRender?.();
  }, [onRender]);

  console.log('render teleported component');

  return children;
}

export { PortalProvider, usePortalContext };
