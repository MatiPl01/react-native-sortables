import { measure, useAnimatedReaction } from 'react-native-reanimated';

import type { ChildrenProps, InterDragInnerContextType } from '../../types';
import { createProvider } from '../utils';
import { useCommonValuesContext } from './CommonValuesProvider';

const { InterDragInnerProvider, useInterDragInnerContext } = createProvider(
  'InterDragInner',
  { guarded: false }
)<ChildrenProps, InterDragInnerContextType>(() => {
  const {
    activeItemAbsolutePosition,
    activeItemDimensions,
    activeItemPosition,
    activeItemTriggerOriginPosition,
    componentId,
    containerRef
  } = useCommonValuesContext();

  useAnimatedReaction(
    () => ({
      dimensions: activeItemDimensions.value,
      positions: {
        absolute: activeItemAbsolutePosition.value,
        relative: activeItemPosition.value,
        trigger: activeItemTriggerOriginPosition.value
      }
    }),
    ({ dimensions, positions }) => {
      if (
        !positions.trigger ||
        !positions.relative ||
        !positions.absolute ||
        !dimensions
      ) {
        return;
      }

      const containerMeasurements = measure(containerRef);
      if (!containerMeasurements) return;

      const dx = positions.trigger.x - positions.relative.x;
      const dy = positions.trigger.y - positions.relative.y;
      const x = positions.absolute.x + dx;
      const y = positions.absolute.y + dy;

      const { height, pageX, pageY, width } = containerMeasurements;

      const isInContainer =
        x >= pageX && x <= pageX + width && y >= pageY && y <= pageY + height;

      console.log(componentId, 'isInContainer', isInContainer);
    }
  );

  return {
    value: {}
  };
});

export { InterDragInnerProvider, useInterDragInnerContext };
