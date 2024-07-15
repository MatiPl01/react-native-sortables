import { type PropsWithChildren, useCallback } from 'react';
import { View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import {
  measure,
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useDerivedValue,
  useScrollViewOffset,
  useSharedValue
} from 'react-native-reanimated';

import { useAnimatableValue, useSmoothValueChange } from '../../hooks';
import type { AutoScrollSettings } from '../../types';
import { createEnhancedContext } from '../utils';
import { useDragContext } from './DragProvider';
import { useMeasurementsContext } from './MeasurementsProvider';

type AutoScrollContextType = {
  updateStartScrollOffset: () => void;
  scrollOffset: SharedValue<number>;
  dragStartScrollOffset: SharedValue<number>;
};

type AutoScrollProviderProps = PropsWithChildren<AutoScrollSettings>;

const { AutoScrollProvider, useAutoScrollContext } = createEnhancedContext(
  'AutoScroll',
  false
)<AutoScrollContextType, AutoScrollProviderProps>(({
  autoScrollActivationOffset,
  autoScrollEnabled,
  autoScrollSpeed,
  children,
  scrollableRef
}) => {
  const { itemDimensions } = useMeasurementsContext();
  const { activeItemKey, activeItemPosition } = useDragContext();

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const scrollOffset = useScrollViewOffset(scrollableRef);
  const targetScrollOffset = useSharedValue(0);
  const dragStartScrollOffset = useAnimatableValue(0);
  const containerRef = useAnimatedRef<View>();

  const activeItemHeight = useDerivedValue(() => {
    const key = activeItemKey.value;
    return key ? itemDimensions.value[key]?.height ?? -1 : -1;
  });
  const offsetThreshold = useAnimatableValue(
    autoScrollActivationOffset,
    (v): { top: number; bottom: number } => {
      'worklet';
      return typeof v === 'number'
        ? { bottom: v, top: v }
        : { bottom: v[1], top: v[0] };
    }
  );
  const enabled = useAnimatableValue(autoScrollEnabled);
  const speed = useAnimatableValue(autoScrollSpeed);

  const currentScrollToValue = useSmoothValueChange(
    dragStartScrollOffset,
    targetScrollOffset,
    speed
  );

  useAnimatedReaction(
    () => scrollOffset.value,
    value => {
      console.log('scrollOffset', value);
    }
  );

  // AUTO SCROLL HANDLER
  // Automatically scrolls the container when the active item is near the edge
  useAnimatedReaction(
    () => {
      if (!enabled.value || activeItemHeight.value === -1) {
        return null;
      }

      return {
        currentOffset: scrollOffset.value,
        itemHeight: activeItemHeight.value,
        itemOffset:
          activeItemPosition.value.y +
          scrollOffset.value -
          dragStartScrollOffset.value,
        threshold: offsetThreshold.value
      };
    },
    props => {
      if (!props) {
        return;
      }

      const scrollableMeasurements = measure(scrollableRef);
      const containerMeasurements = measure(containerRef);

      if (!scrollableMeasurements || !containerMeasurements) {
        return;
      }

      const { currentOffset, itemHeight, itemOffset, threshold } = props;
      const { height: sH, pageY: sY } = scrollableMeasurements;
      const { height: cH, pageY: cY } = containerMeasurements;

      const itemTopOffset = itemOffset;
      const itemBottomOffset = itemTopOffset + itemHeight;

      const topDistance = sY + threshold.top - cY;
      const bottomDistance = cY + cH - (sY + sH - threshold.bottom);

      const topOverflow = sY + threshold.top - (cY + itemTopOffset);
      const bottomOverflow =
        cY + itemBottomOffset - (sY + sH - threshold.bottom);

      // Scroll up
      if (topDistance > 0 && topOverflow > 0) {
        targetScrollOffset.value =
          currentOffset - Math.min(topOverflow, topDistance);
      }
      // Scroll down
      else if (bottomDistance > 0 && bottomOverflow > 0) {
        targetScrollOffset.value =
          currentOffset + Math.min(bottomOverflow, bottomDistance);
      }
    }
  );

  useAnimatedReaction(
    () => currentScrollToValue.value,
    value => {
      scrollTo(scrollableRef, 0, value, false);
    }
  );

  const updateStartScrollOffset = useCallback(() => {
    'worklet';
    dragStartScrollOffset.value = scrollOffset.value;
  }, [dragStartScrollOffset, scrollOffset]);

  return {
    children: (
      <View collapsable={false} ref={containerRef}>
        {children}
      </View>
    ),
    value: {
      dragStartScrollOffset,
      scrollOffset,
      updateStartScrollOffset
    }
  };
});

export { AutoScrollProvider, useAutoScrollContext };
