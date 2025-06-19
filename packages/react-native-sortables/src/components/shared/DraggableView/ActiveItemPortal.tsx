import type { PropsWithChildren, ReactNode } from 'react';
import { Platform, type ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import { usePortalContext } from '../../../providers';
import type { ItemPortalState } from '../../../types';

const TELEPORTED_ITEM_STYLE: ViewStyle = {
  maxHeight: 0,
  opacity: 0,
  ...Platform.select({
    android: {
      elevation: 0
    },
    default: {},
    native: {
      shadowOpacity: 0
    }
  })
};

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
  renderItemCell,
  teleportedItemId
}: ActiveItemPortalProps) {
  const { subscribe, teleport } = usePortalContext()!;

  // useEffect(() => {
  //   const unsubscribe = subscribe(teleportedItemId, teleported => {
  //     if (teleported) {
  //       portalState.value = ItemPortalState.TELEPORTED;
  //     }
  //   });

  //   return () => {
  //     unsubscribe();
  //     teleport(teleportedItemId, null);
  //   };
  // }, [portalState, subscribe, teleport, teleportedItemId]);

  // useEffect(() => {
  //   if (portalState.value === ItemPortalState.TELEPORTED) {
  //     // Renders a component in the portal outlet
  //     teleport(teleportedItemId, renderTeleportedItemCell());
  //   }
  // }, [
  //   portalState,
  //   teleportedItemId,
  //   renderTeleportedItemCell,
  //   teleport,
  //   children
  // ]);

  // const enableTeleport = () => {
  //   teleport(teleportedItemId, renderTeleportedItemCell());
  // };

  // useAnimatedReaction(
  //   () => activationAnimationProgress.value,
  //   progress => {
  //     if (progress > 0 && portalState.value === ItemPortalState.IDLE) {
  //       portalState.value = ItemPortalState.TELEPORTING;
  //       runOnJS(enableTeleport)();
  //     } else if (
  //       progress === 0 &&
  //       portalState.value === ItemPortalState.TELEPORTED
  //     ) {
  //       portalState.value = ItemPortalState.EXITING;
  //     }
  //   }
  // );

  return null;
}
