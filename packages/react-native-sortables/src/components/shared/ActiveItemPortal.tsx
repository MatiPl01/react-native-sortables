import type { PropsWithChildren } from 'react';
import { useEffect, useState } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import Animated, {
  LayoutAnimationConfig,
  runOnJS,
  useAnimatedReaction
} from 'react-native-reanimated';

import {
  useItemContext,
  usePortalContext,
  useTeleportedItemStyles
} from '../../providers';

type ActiveItemPortalProps = PropsWithChildren<{
  activationAnimationProgress: SharedValue<number>;
}>;

export default function ActiveItemPortal({
  activationAnimationProgress,
  children
}: ActiveItemPortalProps) {
  const { itemKey } = useItemContext();
  const [isTeleported, setIsTeleported] = useState(false);

  useAnimatedReaction(
    () => activationAnimationProgress.value,
    progress => {
      if (progress > 0 && !isTeleported) {
        runOnJS(setIsTeleported)(true);
      } else if (progress === 0 && isTeleported) {
        runOnJS(setIsTeleported)(false);
      }
    }
  );

  return (
    isTeleported && (
      <TeleportedActiveItem
        activationAnimationProgress={activationAnimationProgress}
        itemKey={itemKey}>
        {children}
      </TeleportedActiveItem>
    )
  );
}

type TeleportedActiveItemProps = {
  itemKey: string;
} & ActiveItemPortalProps;

function TeleportedActiveItem({
  activationAnimationProgress,
  children,
  itemKey
}: TeleportedActiveItemProps) {
  const { teleport } = usePortalContext()!;

  const teleportedItemStyles = useTeleportedItemStyles(
    itemKey,
    activationAnimationProgress
  );

  useEffect(() => {
    teleport(
      itemKey,
      <LayoutAnimationConfig skipEntering skipExiting>
        <Animated.View style={teleportedItemStyles}>{children}</Animated.View>
      </LayoutAnimationConfig>
    );

    return () => teleport(itemKey, null);
  }, [children, itemKey, teleport, teleportedItemStyles]);

  return null;
}
