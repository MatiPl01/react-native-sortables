import { PropsWithChildren, useEffect, useState } from 'react';
import {
  runOnJS,
  SharedValue,
  useAnimatedReaction
} from 'react-native-reanimated';
import { usePortalContext } from '../../providers';

type MaybeActiveItemPortalProps = Omit<ActiveItemPortalProps, 'teleport'>;

export default function MaybeActiveItemPortal(
  props: MaybeActiveItemPortalProps
) {
  const { teleport } = usePortalContext() ?? {};

  if (!teleport) {
    return props.children;
  }

  return <ActiveItemPortal {...props} teleport={teleport} />;
}

type ActiveItemPortalProps = PropsWithChildren<{
  itemKey: string;
  activationProgress: SharedValue<number>;
  teleport: (itemKey: string, children: React.ReactNode) => void;
  renderTeleportedComponent: () => React.ReactNode;
}>;

function ActiveItemPortal({
  activationProgress,
  children,
  itemKey,
  renderTeleportedComponent,
  teleport
}: ActiveItemPortalProps) {
  const [isTeleported, setIsTeleported] = useState(false);

  useAnimatedReaction(
    () => activationProgress.value,
    progress => {
      if (progress > 0 && !isTeleported) {
        runOnJS(setIsTeleported)(true);
      } else if (progress === 0 && isTeleported) {
        runOnJS(setIsTeleported)(false);
      }
    }
  );

  useEffect(() => {
    teleport?.(itemKey, isTeleported ? renderTeleportedComponent() : null);
  }, [itemKey, renderTeleportedComponent, teleport, isTeleported]);

  return children;
}
