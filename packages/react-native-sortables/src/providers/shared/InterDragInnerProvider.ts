import { measure, useAnimatedReaction } from 'react-native-reanimated';

import type { ChildrenProps } from '../../types';
import { createProvider } from '../utils';
import { useCommonValuesContext } from './CommonValuesProvider';
import { useInterDragContext } from './InterDragProvider';

const { InterDragInnerProvider } = createProvider('InterDragInner', {
  withContext: false
})<ChildrenProps>(() => {
  const { activeItemDimensions, containerId, containerRef } =
    useCommonValuesContext();
  const { activeItemTriggerOriginAbsolutePosition, currentContainerId } =
    useInterDragContext()!;

  useAnimatedReaction(
    () => ({
      dimensions: activeItemDimensions.value,
      position: activeItemTriggerOriginAbsolutePosition.value
    }),
    ({ dimensions, position }) => {
      if (!position || !dimensions) {
        currentContainerId.value = null;
        return;
      }

      const containerMeasurements = measure(containerRef);
      if (!containerMeasurements) return;

      const { height, pageX, pageY, width } = containerMeasurements;
      const { x, y } = position;
      const isInContainer =
        x >= pageX && x <= pageX + width && y >= pageY && y <= pageY + height;

      if (isInContainer) {
        currentContainerId.value = containerId;
      }
    }
  );

  useAnimatedReaction(
    () => currentContainerId.value,
    (currentId, prevId) => {
      if (prevId === null || currentId === null) {
        return;
      }
      if (containerId === currentId) {
        console.log('add item to', currentId);
      } else {
        console.log('remove item from', prevId);
      }
    }
  );
});

export { InterDragInnerProvider };
