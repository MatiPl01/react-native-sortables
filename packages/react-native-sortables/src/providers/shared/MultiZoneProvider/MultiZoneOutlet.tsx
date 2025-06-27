import { measure, useAnimatedReaction } from 'react-native-reanimated';

import { useCommonValuesContext } from '../CommonValuesProvider';
import { useDebugBoundingBox } from '../hooks';
import { usePortalContext } from '../PortalProvider';
import { useMultiZoneContext } from './MultiZoneProvider';

const INACTIVE_COLORS = {
  backgroundColor: '#d6d6d6', // mid grey – clearer contrast
  borderColor: '#5f6368' // dark grey for definition
};

const ACTIVE_COLORS = {
  backgroundColor: '#7e57c2', // medium purple – stands out
  borderColor: '#512da8' // deep purple for emphasis
};

export default function MultiZoneOutlet() {
  const { activeItemDimensions, containerId, outerContainerRef } =
    useCommonValuesContext();
  // Multi-zone provider uses portal context, so we can use it here
  const { activeItemAbsolutePosition } = usePortalContext()!;
  const { activeContainerId } = useMultiZoneContext()!;

  const debugBox = useDebugBoundingBox(true);

  useAnimatedReaction(
    () => ({
      activeContainer: activeContainerId.value,
      dimensions: activeItemDimensions.value,
      position: activeItemAbsolutePosition.value
    }),
    ({ activeContainer, dimensions, position }) => {
      // We don't want to activate the current container as long as other
      // container is active
      if (!position || !dimensions || activeContainer) {
        return;
      }

      const container = measure(outerContainerRef);
      if (!container) {
        return;
      }

      // TODO - maybe add a possibility to customize the item origin
      const centerX = position.x + dimensions.width / 2;
      const centerY = position.y + dimensions.height / 2;
      const { height, pageX, pageY, width } = container;

      // Check if the item is within the bounding box of the zone
      const minX = pageX;
      const maxX = pageX + width;
      const minY = pageY;
      const maxY = pageY + height;

      const isInZone =
        centerX >= minX &&
        centerX <= maxX &&
        centerY >= minY &&
        centerY <= maxY;

      if (!isInZone) {
        console.log('Item is not in zone', containerId);
      }

      if (debugBox) {
        const colors = isInZone ? ACTIVE_COLORS : INACTIVE_COLORS;
        debugBox.top.update({ x: minX, y: minY }, { x: maxX, y: maxY }, colors);
      }
    }
  );

  return <></>;
}
