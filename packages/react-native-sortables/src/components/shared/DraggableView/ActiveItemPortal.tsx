import type { PropsWithChildren } from 'react';
import { useCallback, useEffect, useRef } from 'react';
import type { ManualGesture } from 'react-native-gesture-handler';
import {
  runOnJS,
  type SharedValue,
  useAnimatedReaction
} from 'react-native-reanimated';

import { useStableCallback } from '../../../hooks';
import type { AnimatedStyleProp } from '../../../integrations/reanimated';
import { useMutableValue } from '../../../integrations/reanimated';
import {
  CommonValuesContext,
  ItemContextProvider,
  usePortalContext
} from '../../../providers';
import type { CommonValuesContextType } from '../../../types';
import { getContextProvider } from '../../../utils';
import TeleportedItemCell from './TeleportedItemCell';

const CommonValuesContextProvider = getContextProvider(CommonValuesContext);

type ActiveItemPortalProps = PropsWithChildren<{
  itemKey: string;
  activationAnimationProgress: SharedValue<number>;
  commonValuesContext: CommonValuesContextType;
  cellStyle: AnimatedStyleProp;
  isActive: SharedValue<boolean>;
  gesture: ManualGesture;
  onTeleport: (isTeleported: boolean) => void;
}>;

export default function ActiveItemPortal({
  activationAnimationProgress,
  cellStyle,
  children,
  commonValuesContext,
  gesture,
  isActive,
  itemKey,
  onTeleport
}: ActiveItemPortalProps) {
  const { isTeleported, measurePortalOutlet, teleport } =
    usePortalContext() ?? {};
  const updateTimeoutRef = useRef(-1);
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
            cellStyle={cellStyle}
            isActive={isActive}
            itemKey={itemKey}>
            {children}
          </TeleportedItemCell>
        </ItemContextProvider>
      </CommonValuesContextProvider>
    ),
    [
      activationAnimationProgress,
      children,
      commonValuesContext,
      gesture,
      isActive,
      itemKey,
      cellStyle
    ]
  );

  const teleportedItemId = `${commonValuesContext.containerId}-${itemKey}`;

  const enableTeleport = useStableCallback(() => {
    teleport?.(teleportedItemId, renderTeleportedItemCell());
    onTeleport(true);
  });

  const disableTeleport = useCallback(() => {
    clearTimeout(updateTimeoutRef.current);
    teleport?.(teleportedItemId, null);
    onTeleport(false);
  }, [teleport, teleportedItemId, onTeleport]);

  useEffect(() => disableTeleport, [disableTeleport]);

  useEffect(() => {
    if (isTeleported?.(teleportedItemId)) {
      // We have to delay the update in order not to schedule render via this
      // useEffect at the same time as the enableTeleport render is scheduled.
      // This may happen if the user changes the item style/content via the
      // onDragStart callback (e.g. in collapsible items) when we want to
      // render the view unchanged at first and change it a while later to
      // properly trigger all layout transitions that the item has.
      updateTimeoutRef.current = setTimeout(() => {
        teleport?.(teleportedItemId, renderTeleportedItemCell());
      });
    }
  }, [isTeleported, renderTeleportedItemCell, teleport, teleportedItemId]);

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
