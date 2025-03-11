import type { PropsWithChildren, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import {
  runOnJS,
  useAnimatedReaction,
  useSharedValue
} from 'react-native-reanimated';

import { usePortalContext } from '../../../providers';

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
  const { subscribe, teleport } = usePortalContext()!;
  const [isTeleported, setIsTeleported] = useState(false);
  const teleportRequested = useSharedValue(false);

  useEffect(() => {
    console.log('subscribing', key);
    return subscribe(key, setIsTeleported);
  }, [key, subscribe]);

  useEffect(() => {
    if (teleportRequested.value) {
      // Renders a component in the portal outlet
      console.log('teleporting useEffect', key);
      teleport(key, renderTeleportedItemCell(children));
    }
  }, [key, renderTeleportedItemCell, teleport, teleportRequested, children]);

  const requestTeleport = () => {
    console.log('requestTeleport', key);
    teleport(key, renderTeleportedItemCell(children));
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

  console.log('isTeleported', key, isTeleported);

  // Renders a component within the sortable container
  // (it cannot be unmounted as it is responsible for gesture handling,
  // we can just remove its children when they are already teleported)
  return renderItemCell(isTeleported ? null : children);
}
