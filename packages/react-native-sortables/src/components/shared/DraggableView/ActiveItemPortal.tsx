import { type PropsWithChildren, type ReactNode, useEffect } from 'react';
import {
  runOnJS,
  type SharedValue,
  useAnimatedReaction
} from 'react-native-reanimated';

import { useMutableValue } from '../../../integrations/reanimated';
import { usePortalContext } from '../../../providers';

type ActiveItemPortalProps = PropsWithChildren<{
  teleportedItemId: string;
  activationAnimationProgress: SharedValue<number>;
  renderTeleportedItemCell: () => ReactNode;
}>;

export default function ActiveItemPortal({
  activationAnimationProgress,
  children,
  renderTeleportedItemCell,
  teleportedItemId
}: ActiveItemPortalProps) {
  const { measurePortalOutlet, teleport } = usePortalContext()!;
  const teleportEnabled = useMutableValue(false);

  useEffect(() => {
    if (teleportEnabled.value) {
      teleport(teleportedItemId, renderTeleportedItemCell());
    }
    // This is fine, we want to update the teleported item cell only when
    // the children change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children]);

  const enableTeleport = () => {
    teleport(teleportedItemId, renderTeleportedItemCell());
  };

  const disableTeleport = () => {
    runOnJS(teleport)(teleportedItemId, null);
  };

  useAnimatedReaction(
    () => activationAnimationProgress.value,
    (progress, prevProgress) => {
      if (prevProgress && progress > prevProgress && !teleportEnabled.value) {
        // We have to ensure that the portal outlet ref is measured before the
        // teleported item is rendered within it because portal outlet position
        // must be known to calculate the teleported item position
        measurePortalOutlet?.();
        teleportEnabled.value = true;
        runOnJS(enableTeleport)();
      } else if (progress === 0 && teleportEnabled.value) {
        teleportEnabled.value = false;
        runOnJS(disableTeleport)();
      }
    }
  );

  return null;
}
