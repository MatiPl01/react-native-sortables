import { useCallback, useEffect } from 'react';
import type { ManualGesture } from 'react-native-gesture-handler';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';

import { useStableCallback } from '../../../hooks';
import { useMutableValue } from '../../../integrations/reanimated';
import {
  CommonValuesContext,
  DataContext,
  DataItemOutlet,
  ItemContextProvider,
  useDataContext,
  usePortalContext
} from '../../../providers';
import type { CommonValuesContextType } from '../../../types';
import { getContextProvider } from '../../../utils';
import type { ItemCellProps } from './ItemCell';
import TeleportedItemCell from './TeleportedItemCell';

const DataContextProvider = getContextProvider(DataContext);
const CommonValuesContextProvider = getContextProvider(CommonValuesContext);

type ActiveItemPortalProps = Pick<
  ItemCellProps,
  'activationAnimationProgress' | 'baseStyle' | 'isActive' | 'itemKey'
> & {
  commonValuesContext: CommonValuesContextType;
  gesture: ManualGesture;
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
  const dataContext = useDataContext();
  const { measurePortalOutlet, teleport } = usePortalContext() ?? {};

  const teleportEnabled = useMutableValue(false);
  // const isFirstUpdateRef = useRef(true);

  const renderTeleportedItemCell = useCallback(
    () => (
      // We have to wrap the TeleportedItemCell in context providers as they won't
      // be accessible otherwise, when the item is rendered in the portal outlet
      <DataContextProvider value={dataContext}>
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
              <DataItemOutlet itemKey={itemKey} />
            </TeleportedItemCell>
          </ItemContextProvider>
        </CommonValuesContextProvider>
      </DataContextProvider>
    ),
    [
      activationAnimationProgress,
      baseStyle,
      commonValuesContext,
      dataContext,
      gesture,
      isActive,
      itemKey
    ]
  );

  const teleportedItemId = `${commonValuesContext.containerId}-${itemKey}`;

  const enableTeleport = useStableCallback(() => {
    // isFirstUpdateRef.current = true;
    teleport?.(teleportedItemId, renderTeleportedItemCell());
    onTeleport(true);
  });

  const disableTeleport = useCallback(() => {
    teleport?.(teleportedItemId, null);
    onTeleport(false);
  }, [teleport, teleportedItemId, onTeleport]);

  useEffect(() => disableTeleport, [disableTeleport]);

  // TODO - check if this works and remove isTeleported from portal if this is not needed
  // useEffect(() => {
  //   const checkTeleported = () => isTeleported?.(teleportedItemId);
  //   if (!checkTeleported()) return;

  //   const update = () =>
  //     teleport?.(teleportedItemId, renderTeleportedItemCell());

  //   if (isFirstUpdateRef.current) {
  //     isFirstUpdateRef.current = false;
  //     // Needed for proper collapsible items behavior
  //     setTimeout(update);
  //   } else {
  //     update();
  //   }
  // }, [isTeleported, renderTeleportedItemCell, teleport, teleportedItemId]);

  useAnimatedReaction(
    () => activationAnimationProgress.value,
    (progress, prevProgress) => {
      if (
        prevProgress !== null &&
        progress > prevProgress &&
        !teleportEnabled.value
      ) {
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
