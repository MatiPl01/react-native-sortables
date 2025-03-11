import type { PropsWithChildren, ReactNode } from 'react';
import { useEffect } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import {
  runOnJS,
  useAnimatedReaction,
  useSharedValue
} from 'react-native-reanimated';

import { useIsTeleported, usePortalContext } from '../../../providers';

type ActiveItemPortalProps = PropsWithChildren<{
  itemKey: string;
  activationAnimationProgress: SharedValue<number>;
  renderItemCell: (cellChildren: ReactNode) => ReactNode;
  renderTeleportedItemCell: (cellChildren: ReactNode) => ReactNode;
}>;

export default function ActiveItemPortal({
  activationAnimationProgress,
  children,
  itemKey: key,
  renderItemCell,
  renderTeleportedItemCell
}: ActiveItemPortalProps) {
  const { teleport } = usePortalContext()!;
  const teleportRequested = useSharedValue(false);
  const isTeleported = useIsTeleported(key);

  const requestTeleport = () => {
    teleport(key, renderTeleportedItemCell(children));
  };

  const cancelTeleport = () => {
    teleport(key, null);
  };

  useAnimatedReaction(
    () => activationAnimationProgress.value,
    progress => {
      if (progress > 0 && !teleportRequested.value) {
        runOnJS(requestTeleport)();
        teleportRequested.value = true;
      } else if (progress === 0 && teleportRequested.value) {
        runOnJS(cancelTeleport)();
        teleportRequested.value = false;
      }
    }
  );

  useEffect(() => {
    if (teleportRequested.value) {
      // Renders a component in the portal outlet
      teleport(key, renderTeleportedItemCell(children));
    }
  }, [key, renderTeleportedItemCell, teleport, teleportRequested, children]);

  console.log('isTeleported', key, isTeleported);

  // Renders a component within the sortable container
  // (it cannot be unmounted as it is responsible for gesture handling,
  // we can just remove its children when they are already teleported)
  return renderItemCell(isTeleported ? null : children);
}
