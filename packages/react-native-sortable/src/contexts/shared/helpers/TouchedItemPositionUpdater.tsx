import {
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue
} from 'react-native-reanimated';

import { useAnimatableValue } from '../../../hooks';
import type { ActiveItemSnapSettings } from '../../../types';
import { getOffsetDistance } from '../../../utils';
import {
  useAutoScrollContext,
  useDragContext,
  useMeasurementsContext,
  usePositionsContext
} from '../providers';

export default function TouchedItemPositionUpdater({
  enableActiveItemSnap,
  snapOffsetX: providedSnapOffsetX,
  snapOffsetY: providedSnapOffsetY
}: ActiveItemSnapSettings) {
  const { touchedItemDimensions } = useMeasurementsContext();
  const { relativeTouchPosition, touchStartPosition, touchedItemPosition } =
    usePositionsContext();
  const { activationProgress, activeItemTranslation } = useDragContext();
  const { dragStartScrollOffset, scrollOffset } = useAutoScrollContext() ?? {};

  const snapEnabled = useAnimatableValue(enableActiveItemSnap);
  const snapOffsetX = useAnimatableValue(providedSnapOffsetX);
  const snapOffsetY = useAnimatableValue(providedSnapOffsetY);

  const targetDeltaX = useSharedValue(0);
  const targetDeltaY = useSharedValue(0);
  const deltaX = useDerivedValue(
    () => targetDeltaX.value * activationProgress.value
  );
  const deltaY = useDerivedValue(
    () => targetDeltaY.value * activationProgress.value
  );

  useAnimatedReaction(
    () => ({
      enableSnap: snapEnabled.value,
      oX: snapOffsetX.value,
      oY: snapOffsetY.value,
      touchPosition: relativeTouchPosition.value,
      ...touchedItemDimensions.value
    }),
    ({ enableSnap, height, oX, oY, touchPosition, width }) => {
      if (!enableSnap || !height || !width || !touchPosition) {
        targetDeltaX.value = 0;
        targetDeltaY.value = 0;
        return;
      }

      targetDeltaX.value = getOffsetDistance(oX, width) - touchPosition.x;
      targetDeltaY.value = getOffsetDistance(oY, height) - touchPosition.y;
    }
  );

  useAnimatedReaction(
    () => ({
      dX: deltaX.value,
      dY: deltaY.value,
      enableSnap: snapEnabled.value,
      scrollOffsetY:
        dragStartScrollOffset?.value === -1
          ? 0
          : (scrollOffset?.value ?? 0) - (dragStartScrollOffset?.value ?? 0),
      startPosition: touchStartPosition.value,
      translation: activeItemTranslation.value
    }),
    ({ dX, dY, enableSnap, scrollOffsetY, startPosition, translation }) => {
      if (!startPosition) {
        touchedItemPosition.value = null;
        return;
      }
      touchedItemPosition.value = {
        x: startPosition.x + (translation?.x ?? 0) - (enableSnap ? dX : 0),
        y:
          startPosition.y +
          (translation?.y ?? 0) -
          (enableSnap ? dY : 0) +
          scrollOffsetY
      };
    }
  );

  return null;
}
