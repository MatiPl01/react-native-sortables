import { useCallback, useEffect, useState } from 'react';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';

import type { SortableGesture } from '../../../integrations/gesture-handler';
import { useMutableValue } from '../../../integrations/reanimated';
import {
  CommonValuesContext,
  ItemContextProvider,
  useItemNode,
  usePortalContext
} from '../../../providers';
import type { CommonValuesContextType } from '../../../types';
import { getContextProvider } from '../../../utils';
import type { ItemCellProps } from './ItemCell';
import TeleportedItemCell from './TeleportedItemCell';

const CommonValuesContextProvider = getContextProvider(CommonValuesContext);

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
  const { measurePortalOutlet, teleport } = usePortalContext() ?? {};

  const teleportEnabled = useMutableValue(false);

  const renderTeleportedItemCell = useCallback(
    () => (
      // We have to wrap the TeleportedItemCell in context providers as they won't
      // be accessible otherwise, when the item is rendered in the portal outlet
      <CommonValuesContextProvider value={commonValuesContext}>
        <ItemContextProvider
          activationAnimationProgress={activationAnimationProgress}
          gesture={gesture}
          isActive={isActive}
          itemKey={itemKey}>
          <TeleportedItemCell
            activationAnimationProgress={activationAnimationProgress}
            baseStyle={baseStyle}
            isActive={isActive}
            itemKey={itemKey}>
            {node}
          </TeleportedItemCell>
        </ItemContextProvider>
      </CommonValuesContextProvider>
    ),
    [
      activationAnimationProgress,
      baseStyle,
      commonValuesContext,
      gesture,
      isActive,
      node,
      itemKey
    ]
  );

  const teleportedItemId = `${commonValuesContext.containerId}-${itemKey}`;

  const [teleported, setTeleported] = useState(false);

  // Hide the source item while teleported and clear the outlet on teardown.
  // Deliberately independent of `renderTeleportedItemCell` so that re-pushing a
  // collapsed cell (effect below) never toggles the source's hidden state -
  // otherwise the source item stays visible under the teleported copy.
  useEffect(() => {
    if (!teleported) return;
    onTeleport(true);
    return () => {
      teleport?.(teleportedItemId, null);
      onTeleport(false);
    };
  }, [teleported, teleport, teleportedItemId, onTeleport]);

  // Keep the outlet in sync with the current cell. `renderTeleportedItemCell`
  // changes identity when the item node changes (e.g. a collapsible item shrinks
  // on drag), so this re-pushes the up-to-date cell - no timer, no source toggle.
  useEffect(() => {
    if (!teleported) return;
    teleport?.(teleportedItemId, renderTeleportedItemCell());
  }, [teleported, teleport, teleportedItemId, renderTeleportedItemCell]);

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

  return null;
}
