import type { AnimatedRef, SharedValue } from 'react-native-reanimated';
import { measure, useAnimatedReaction } from 'react-native-reanimated';

import { useDebugContext } from '../../../debug';
import type { Animatable } from '../../../integrations/reanimated';
import {
  useAnimatableValue,
  useMutableValue
} from '../../../integrations/reanimated';
import { useCommonValuesContext } from '../CommonValuesProvider';
import {
  handleMeasurementsHorizontal,
  handleMeasurementsVertical
} from './utils';

export default function useTargetScrollOffset(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scrollableRef: AnimatedRef<any>,
  enabled: SharedValue<boolean>,
  horizontal: boolean,
  autoScrollActivationOffset: Animatable<[number, number] | number>,
  maxScrollToOverflowOffset: Animatable<[number, number] | null | number>,
  dragStartScrollOffset: SharedValue<null | number>
): SharedValue<null | number> {
  const { outerContainerRef, touchPosition } = useCommonValuesContext();
  const debugContext = useDebugContext();

  const debugRects = debugContext?.useDebugRects(['start', 'end']);
  const debugLine = debugContext?.useDebugLine();

  const targetScrollOffset = useMutableValue<null | number>(null);
  const startContainerPagePosition = useMutableValue<null | number>(null);

  const offsetThreshold = useAnimatableValue(
    autoScrollActivationOffset,
    (v): [number, number] => {
      'worklet';
      return typeof v === 'number' ? [v, v] : v;
    }
  );
  const maxOverScrollOffset = useAnimatableValue(
    maxScrollToOverflowOffset,
    (v): [number, number] | null => {
      'worklet';
      return typeof v === 'number' ? [v, v] : v;
    }
  );

  const handleMeasurements = horizontal
    ? handleMeasurementsHorizontal
    : handleMeasurementsVertical;

  useAnimatedReaction(
    () => {
      if (!enabled.value || !touchPosition.value) {
        startContainerPagePosition.value = null;
        targetScrollOffset.value = null;
        return null;
      }

      return {
        threshold: offsetThreshold.value,
        touchOffset: touchPosition.value?.[horizontal ? 'x' : 'y']
      };
    },
    props => {
      const hideDebugViews = () => {
        debugRects?.start?.hide();
        debugRects?.end?.hide();
        debugLine?.hide();
      };

      if (!props) {
        hideDebugViews();
        return;
      }

      const scrollableMeasurements = measure(scrollableRef);
      const containerMeasurements = measure(outerContainerRef);

      if (
        !scrollableMeasurements ||
        !containerMeasurements ||
        dragStartScrollOffset.value === null
      ) {
        hideDebugViews();
        return;
      }

      const {
        containerPosition,
        endDistance,
        endOverflow,
        startDistance,
        startOverflow
      } = handleMeasurements(
        props.threshold,
        maxOverScrollOffset.value,
        props.touchOffset,
        scrollableMeasurements,
        containerMeasurements,
        debugRects,
        debugLine
      );

      startContainerPagePosition.value ??= containerPosition;

      const offsetDelta = startContainerPagePosition.value - containerPosition;
      const currentOffset = dragStartScrollOffset.value + offsetDelta;
      // Scroll up (vertical) / left (horizontal)
      if (startDistance > 0 && startOverflow > 0) {
        targetScrollOffset.value =
          currentOffset - Math.min(startOverflow, startDistance);
      }
      // Scroll down (vertical) / right (horizontal)
      else if (endDistance > 0 && endOverflow > 0) {
        targetScrollOffset.value =
          currentOffset + Math.min(endOverflow, endDistance);
      }
    }
  );

  return targetScrollOffset;
}
