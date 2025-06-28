import type { PropsWithChildren } from 'react';
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import type { View } from 'react-native';
import type { MeasuredDimensions } from 'react-native-reanimated';
import { measure, useAnimatedRef } from 'react-native-reanimated';

import { EMPTY_OBJECT } from '../../constants';
import { useMutableValue } from '../../integrations/reanimated';
import type {
  PortalContextType,
  PortalSubscription,
  Vector
} from '../../types';
import { createProvider } from '../utils';
import { PortalOutletProvider } from './PortalOutletProvider';

/** Props for the PortalProvider component */
type PortalProviderProps = PropsWithChildren<{
  /** Whether portal functionality is enabled.
   * When disabled, no items will be teleported to the portal outlet.
   * @default true
   */
  enabled?: boolean;
  /** Whether to propagate portal context to outer portal providers.
   * When true, teleported items will be rendered in the outermost enabled portal
   * outlet if portal providers are nested.
   * @default false
   */
  propagateToOuterPortal?: boolean;
}>;

const { PortalContext, PortalProvider, usePortalContext } = createProvider(
  'Portal',
  {
    guarded: false
  }
)<PortalProviderProps, PortalContextType>(({
  children,
  enabled,
  propagateToOuterPortal = false
}) => {
  // I need to cast the type because TS goes crazy when I am trying to use it
  // directly. I am casting it to the same type as the return type of usePortalContext
  const outerPortalContext =
    usePortalContext() as unknown as null | PortalContextType;

  const [teleportedNodes, setTeleportedNodes] =
    useState<Record<string, React.ReactNode>>(EMPTY_OBJECT);
  const subscribersRef = useRef<Record<string, Set<PortalSubscription>>>({});
  const portalOutletRef = useAnimatedRef<View>();

  const activeItemAbsolutePosition = useMutableValue<null | Vector>(null);
  const portalOutletMeasurements = useMutableValue<MeasuredDimensions | null>(
    null
  );

  const shouldPropagate = !!outerPortalContext && propagateToOuterPortal;

  useEffect(() => {
    if (!enabled || shouldPropagate) {
      setTeleportedNodes(EMPTY_OBJECT);
    }
  }, [enabled, shouldPropagate]);

  const notifySubscribers = useCallback((id: string, isTeleported: boolean) => {
    subscribersRef.current?.[id]?.forEach(subscriber =>
      subscriber(isTeleported)
    );
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

  const value = shouldPropagate
    ? outerPortalContext
    : {
        activeItemAbsolutePosition,
        measurePortalOutlet,
        portalOutletMeasurements,
        subscribe,
        teleport
      };

  const outlet = useMemo(
    () =>
      !shouldPropagate && (
        <PortalOutletProvider
          measurePortalOutlet={measurePortalOutlet}
          portalOutletRef={portalOutletRef}>
          {Object.entries(teleportedNodes).map(([id, node]) => (
            <Fragment key={id}>{node}</Fragment>
          ))}
        </PortalOutletProvider>
      ),
    [measurePortalOutlet, portalOutletRef, shouldPropagate, teleportedNodes]
  );

  return {
    children: (
      <Fragment>
        {children}
        {outlet}
      </Fragment>
    ),
    enabled,
    value: value
  };
});

export { PortalContext, PortalProvider, usePortalContext };
