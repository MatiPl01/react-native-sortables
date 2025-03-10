import type { ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';

type ActiveItemPortalProps = {
  activationAnimationProgress: SharedValue<number>;
  renderItemCell: () => ReactNode;
  renderPlaceholderCell: () => ReactNode;
  renderTeleportedItemCell: (onRender: () => void) => ReactNode;
};

export default function ActiveItemPortal({
  activationAnimationProgress,
  renderItemCell,
  renderPlaceholderCell,
  renderTeleportedItemCell
}: ActiveItemPortalProps) {
  const [teleportEnabled, setTeleportEnabled] = useState(false);
  const [isTeleported, setIsTeleported] = useState(false);

  const enableTeleport = () => {
    setTeleportEnabled(true);
  };

  const disableTeleport = () => {
    setTeleportEnabled(false);
    setIsTeleported(false);
  };

  useAnimatedReaction(
    () => activationAnimationProgress.value,
    progress => {
      if (progress > 0 && !teleportEnabled) {
        runOnJS(enableTeleport)();
      } else if (progress === 0 && teleportEnabled) {
        runOnJS(disableTeleport)();
      }
    }
  );

  const handleTeleportRender = useCallback(() => {
    console.log('call onRender from ActiveItemPortal');
    setIsTeleported(true);
  }, []);

  console.log({ isTeleported, teleportEnabled });

  const item = useMemo(
    () => (isTeleported ? renderPlaceholderCell() : renderItemCell()),
    [isTeleported, renderItemCell, renderPlaceholderCell]
  );
  const teleportedItem = useMemo(
    () => teleportEnabled && renderTeleportedItemCell(handleTeleportRender),
    [handleTeleportRender, renderTeleportedItemCell, teleportEnabled]
  );

  return (
    <>
      {item}
      {teleportedItem}
    </>
  );
}
