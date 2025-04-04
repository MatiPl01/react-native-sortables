import type { PropsWithChildren, ReactNode } from 'react';
import { useEffect } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';

import { usePortalContext } from '../../../providers';
import { ItemPortalState } from '../../../types';

type ActiveItemPortalProps = PropsWithChildren<{
  teleportedItemId: string;
  activationAnimationProgress: SharedValue<number>;
  portalState: SharedValue<ItemPortalState>;
  renderTeleportedItemCell: () => ReactNode;
}>;

export default function ActiveItemPortal({
  activationAnimationProgress,
  children,
  portalState,
  renderTeleportedItemCell,
  teleportedItemId
}: ActiveItemPortalProps) {
  const { subscribe, teleport } = usePortalContext()!;

  useEffect(() => {
    const unsubscribe = subscribe(teleportedItemId, teleported => {
      if (teleported) {
        portalState.value = ItemPortalState.TELEPORTED;
      }
    });

    return () => {
      unsubscribe();
      teleport(teleportedItemId, null);
    };
  }, [portalState, subscribe, teleport, teleportedItemId]);

  useEffect(() => {
    if (portalState.value === ItemPortalState.TELEPORTED) {
      // Renders a component in the portal outlet
      teleport(teleportedItemId, renderTeleportedItemCell());
    }
  }, [
    portalState,
    teleportedItemId,
    renderTeleportedItemCell,
    teleport,
    children
  ]);

  const enableTeleport = () => {
    teleport(teleportedItemId, renderTeleportedItemCell());
  };

  useAnimatedReaction(
    () => activationAnimationProgress.value,
    progress => {
      if (progress > 0 && portalState.value === ItemPortalState.IDLE) {
        portalState.value = ItemPortalState.TELEPORTING;
        runOnJS(enableTeleport)();
      } else if (
        progress === 0 &&
        portalState.value === ItemPortalState.TELEPORTED
      ) {
        portalState.value = ItemPortalState.EXITING;
      }
    }
  );

  return null;
}
