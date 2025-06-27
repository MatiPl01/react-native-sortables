import type { PropsWithChildren } from 'react';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import type { View } from 'react-native';
import type { MeasuredDimensions } from 'react-native-reanimated';
import { measure, useAnimatedRef } from 'react-native-reanimated';

import { useMutableValue } from '../../integrations/reanimated';
import type {
  PortalContextType,
  PortalSubscription,
  Vector
} from '../../types';
import { createProvider } from '../utils';
import { PortalOutletProvider } from './PortalOutletProvider';

type PortalProviderProps = PropsWithChildren<{
  enabled?: boolean;
}>;

const { PortalProvider, usePortalContext } = createProvider('Portal', {
  guarded: false
})<PortalProviderProps, PortalContextType>(({ children, enabled }) => {
  const [teleportedNodes, setTeleportedNodes] = useState<
    Record<string, React.ReactNode>
  >({});
  const subscribersRef = useRef<Record<string, Set<PortalSubscription>>>({});
  const portalOutletRef = useAnimatedRef<View>();

  const activeItemAbsolutePosition = useMutableValue<null | Vector>(null);
  const portalOutletMeasurements = useMutableValue<MeasuredDimensions | null>(
    null
  );

  useEffect(() => {
    if (!enabled) {
      setTeleportedNodes({});
    }
  }, [enabled]);

  const notifySubscribers = useCallback((id: string, isTeleported: boolean) => {
    subscribersRef.current[id]?.forEach(subscriber => subscriber(isTeleported));
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

  const subscribe = useCallback(
    (id: string, subscriber: PortalSubscription) => {
      subscribersRef.current[id] = subscribersRef.current[id] ?? new Set();
      subscribersRef.current[id].add(subscriber);
      return () => {
        subscribersRef.current[id]?.delete(subscriber);
      };
    },
    []
  );

  const measurePortalOutlet = useCallback(() => {
    'worklet';
    portalOutletMeasurements.value = measure(portalOutletRef);
  }, [portalOutletRef, portalOutletMeasurements]);

  return {
    children: (
      <Fragment>
        {children}
        <PortalOutletProvider
          measurePortalOutlet={measurePortalOutlet}
          portalOutletRef={portalOutletRef}>
          {Object.entries(teleportedNodes).map(([id, node]) => (
            <Fragment key={id}>{node}</Fragment>
          ))}
        </PortalOutletProvider>
      </Fragment>
    ),
    enabled,
    value: {
      activeItemAbsolutePosition,
      measurePortalOutlet,
      portalOutletMeasurements,
      subscribe,
      teleport
    }
  };
});

export { PortalProvider, usePortalContext };
