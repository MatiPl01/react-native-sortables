import type { PropsWithChildren, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import {
  runOnJS,
  useAnimatedReaction,
  useSharedValue
} from 'react-native-reanimated';

import { usePortalContext, useTeleportedItemId } from '../../../providers';

type ActiveItemPortalProps = PropsWithChildren<{
  itemKey: string;
  activationAnimationProgress: SharedValue<number>;
  renderItemCell: (displayed?: boolean) => ReactNode;
  renderTeleportedItemCell: (displayed?: boolean) => ReactNode;
}>;

export default function ActiveItemPortal({
  activationAnimationProgress,
  children,
  itemKey: key,
  renderItemCell,
  renderTeleportedItemCell
}: ActiveItemPortalProps) {
  const teleportedItemId = useTeleportedItemId(key);
  const { subscribe, teleport } = usePortalContext()!;
  const [isTeleported, setIsTeleported] = useState(false);
  const teleportRequested = useSharedValue(false);

  useEffect(() => {
    return subscribe(teleportedItemId, setIsTeleported);
  }, [teleportedItemId, subscribe]);

  useEffect(() => {
    if (teleportRequested.value) {
      // Renders a component in the portal outlet
      teleport(teleportedItemId, renderTeleportedItemCell());
    }
  }, [
    teleportedItemId,
    renderTeleportedItemCell,
    teleport,
    teleportRequested,
    children
  ]);

  const requestTeleport = () => {
    teleport(teleportedItemId, renderTeleportedItemCell());
  };

  useAnimatedReaction(
    () => activationAnimationProgress.value,
    progress => {
      if (progress > 0 && !teleportRequested.value) {
        runOnJS(requestTeleport)();
        teleportRequested.value = true;
      } else if (progress === 0 && teleportRequested.value) {
        // We have to make sure that the item was rendered back in the
        // sortable container before removing the teleported item
        runOnJS(setIsTeleported)(false);
        teleportRequested.value = false;
      }
    }
  );

  // Renders a component within the sortable container
  // (it cannot be unmounted as it is responsible for gesture handling,
  // we can just remove its children when they are already teleported)
  return (
    <>
      {renderItemCell(!isTeleported)}
      {isTeleported && (
        <TeleportRemovalHelper
          teleport={teleport}
          teleportedItemId={teleportedItemId}
        />
      )}
    </>
  );
}

type TeleportRemovalHelperProps = {
  teleportedItemId: string;
  teleport: (id: string, node: ReactNode) => void;
};

function TeleportRemovalHelper({
  teleport,
  teleportedItemId
}: TeleportRemovalHelperProps) {
  useEffect(() => {
    return () => teleport(teleportedItemId, null);
  }, [teleport, teleportedItemId]);

  return null;
}
