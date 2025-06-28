import type { View } from 'react-native';
import type { AnimatedRef, SharedValue } from 'react-native-reanimated';
import { measure, useAnimatedReaction } from 'react-native-reanimated';

import { useMutableValue } from '../../../../integrations/reanimated';
import useZoneContext from './useZoneContext';

export type ZoneHandlers = {
  onItemEnter?: () => void;
  onItemLeave?: () => void;
  onItemDrop?: () => void;
};

export default function useZoneHandlers(
  containerRef: AnimatedRef<View>,
  minActivationDistance: number,
  handlers?: ZoneHandlers
): SharedValue<boolean> {
  const { activeItemAbsolutePosition, activeItemDimensions } = useZoneContext();
  const isInZone = useMutableValue(false);

  useAnimatedReaction(
    () => ({
      dimensions: activeItemDimensions.value,
      offset: minActivationDistance,
      position: activeItemAbsolutePosition.value
    }),
    ({ dimensions, offset, position }, prev) => {
      const hasActiveItem = !!position && !!dimensions;
      if (!hasActiveItem) {
        const hadActiveItem = !!prev?.dimensions && !!prev?.position;
        if (isInZone.value && hadActiveItem) {
          handlers?.onItemDrop?.();
        }
        isInZone.value = false;
        return;
      }

      const container = measure(containerRef);
      if (!container) {
        isInZone.value = false;
        return;
      }

      // TODO - maybe add a possibility to customize the item origin
      const centerX = position.x + dimensions.width / 2;
      const centerY = position.y + dimensions.height / 2;
      const { height, pageX, pageY, width } = container;

      // Check if the item is within the bounding box of the zone
      const minX = pageX - offset;
      const maxX = pageX + width + offset;
      const minY = pageY - offset;
      const maxY = pageY + height + offset;

      const inZone =
        centerX >= minX &&
        centerX <= maxX &&
        centerY >= minY &&
        centerY <= maxY;

      if (inZone && !isInZone.value) {
        isInZone.value = true;
        handlers?.onItemEnter?.();
      } else if (!inZone && isInZone.value) {
        isInZone.value = false;
        handlers?.onItemLeave?.();
      }
    }
  );

  return isInZone;
}
