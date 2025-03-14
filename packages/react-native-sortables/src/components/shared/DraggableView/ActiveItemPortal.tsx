import type { PropsWithChildren, ReactNode } from 'react';
import { useEffect } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated';

import { usePortalContext, useTeleportedItemId } from '../../../providers';
import type { AnimatedStyleProp, MeasureCallback } from '../../../types';

type ActiveItemPortalProps = PropsWithChildren<{
  itemKey: string;
  activationAnimationProgress: SharedValue<number>;
  onMeasureItem: MeasureCallback;
  renderItemCell: (
    onMeasure: MeasureCallback,
    itemStyle?: AnimatedStyleProp
  ) => ReactNode;
  renderTeleportedItemCell: () => ReactNode;
}>;

export default function ActiveItemPortal({
  activationAnimationProgress,
  children,
  itemKey: key,
  onMeasureItem,
  renderItemCell,
  renderTeleportedItemCell
}: ActiveItemPortalProps) {
  const teleportedItemId = useTeleportedItemId(key);
  const { subscribe, teleport } = usePortalContext()!;
  const canEnableTeleport = useSharedValue(true);
  const isTeleported = useSharedValue(false);

  useEffect(() => {
    return subscribe(teleportedItemId, () => {
      isTeleported.value = true;
    });
  }, [isTeleported, subscribe, teleportedItemId]);

  useEffect(() => {
    if (isTeleported.value) {
      // Renders a component in the portal outlet
      teleport(teleportedItemId, renderTeleportedItemCell());
    }
  }, [
    teleportedItemId,
    renderTeleportedItemCell,
    teleport,
    isTeleported,
    children
  ]);

  const enableTeleport = () => {
    teleport(teleportedItemId, renderTeleportedItemCell());
  };

  const onMeasure = (width: number, height: number) => {
    if (canEnableTeleport.value) {
      onMeasureItem(width, height);
    } else if (!isTeleported.value && height > 0 && width > 0) {
      // canEnableTeleport is false when the item is already teleported
      // We want to use this instead of isTeleported as isTeleported is set
      // to false before to make the not teleported item back visible
      teleport(teleportedItemId, null);
      canEnableTeleport.value = true;
    }
  };

  const animatedItemStyle = useAnimatedStyle(() =>
    isTeleported.value
      ? {
          maxHeight: 0,
          overflow: 'hidden'
        }
      : {
          maxHeight: 'auto',
          overflow: 'visible'
        }
  );

  useAnimatedReaction(
    () => activationAnimationProgress.value,
    progress => {
      if (progress > 0 && canEnableTeleport.value) {
        canEnableTeleport.value = false;
        runOnJS(enableTeleport)();
      } else if (progress === 0) {
        isTeleported.value = false;
      }
    }
  );

  // Renders a component within the sortable container
  // (it cannot be unmounted as it is responsible for gesture handling,
  // we can just remove its children when they are already teleported)
  return renderItemCell(onMeasure, animatedItemStyle);
}
