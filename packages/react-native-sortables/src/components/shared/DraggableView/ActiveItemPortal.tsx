import { useEffect, useState } from 'react';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';

import type { SortableGesture } from '../../../integrations/gesture-handler';
import { useMutableValue } from '../../../integrations/reanimated';
import { Teleport, useItemNode, usePortalContext } from '../../../providers';
import type { CommonValuesContextType } from '../../../types';
import type { ItemCellProps } from './ItemCell';
import TeleportedItemCell from './TeleportedItemCell';

type ActiveItemPortalProps = Pick<
  ItemCellProps,
  'activationAnimationProgress' | 'baseStyle' | 'isActive' | 'itemKey'
> & {
  commonValuesContext: CommonValuesContextType;
  gesture: SortableGesture;
  onTeleport: (isTeleported: boolean) => void;
};

export default function ActiveItemPortal({
  activationAnimationProgress,
  baseStyle,
  commonValuesContext,
  gesture,
  isActive,
  itemKey,
  onTeleport
}: ActiveItemPortalProps) {
  const node = useItemNode(itemKey);
  const { measurePortalOutlet } = usePortalContext() ?? {};

  const teleportEnabled = useMutableValue(false);
  const [teleported, setTeleported] = useState(false);
  const teleportedItemId = `${commonValuesContext.containerId}-${itemKey}`;

  // Hide the source item while teleported. Keyed on `teleported` only, so a
  // collapsing item re-rendering its teleported cell never toggles the source.
  useEffect(() => {
    if (!teleported) return;
    onTeleport(true);
    return () => onTeleport(false);
  }, [teleported, onTeleport]);

  useAnimatedReaction(
    () => activationAnimationProgress.value,
    (progress, prevProgress) => {
      if (
        prevProgress !== null &&
        progress > prevProgress &&
        !teleportEnabled.value
      ) {
        // Measure the outlet before rendering into it - the teleported item's
        // position is computed from the outlet's on-screen position.
        measurePortalOutlet?.();
        teleportEnabled.value = true;
        runOnJS(setTeleported)(true);
      } else if (progress === 0 && teleportEnabled.value) {
        teleportEnabled.value = false;
        runOnJS(setTeleported)(false);
      }
    }
  );

  if (!teleported) return null;

  return (
    <Teleport id={teleportedItemId}>
      <TeleportedItemCell
        activationAnimationProgress={activationAnimationProgress}
        baseStyle={baseStyle}
        commonValuesContext={commonValuesContext}
        gesture={gesture}
        isActive={isActive}
        itemKey={itemKey}>
        {node}
      </TeleportedItemCell>
    </Teleport>
  );
}
