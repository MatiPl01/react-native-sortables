import { type PropsWithChildren, useCallback } from 'react';
import { View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import {
  measure,
  runOnJS,
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useDerivedValue,
  useFrameCallback,
  useScrollViewOffset,
  useSharedValue
} from 'react-native-reanimated';

import { OFFSET_EPS } from '../../../constants';
import { useAnimatableValue } from '../../../hooks';
import type { AutoScrollSettings } from '../../../types';
import { createEnhancedContext } from '../../utils';
import { useDragContext } from './DragProvider';
import { useMeasurementsContext } from './MeasurementsProvider';

type AutoScrollContextType = {
  updateStartScrollOffset: () => void;
  currentScrollOffset: SharedValue<number>;
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
  const currentScrollOffset = useScrollViewOffset(scrollableRef);
  const targetScrollOffset = useSharedValue(-1);
  const dragStartScrollOffset = useAnimatableValue(-1);
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

  // SMOOTH SCROLL POSITION UPDATER
  // Updates the scroll position smoothly
  // (quickly at first, then slower if the remaining distance is small)
  const frameCallback = useFrameCallback(() => {
    const currentOffset = currentScrollOffset.value;
    const targetOffset = targetScrollOffset.value;
    const diff = targetOffset - currentOffset;

    if (Math.abs(diff) < OFFSET_EPS || targetOffset === -1) {
      targetScrollOffset.value = -1;
      return;
    }

    const direction = diff > 0 ? 1 : -1;
    const step = speed.value * direction * Math.sqrt(Math.abs(diff));
    const nextOffset = currentOffset + step;

    scrollTo(scrollableRef, 0, nextOffset, false);
  });

  const toggleFrameCallback = useCallback(
    (isEnabled: boolean) => frameCallback.setActive(isEnabled),
    [frameCallback]
  );

  // Enable/disable frame callback based on the auto scroll state
  useAnimatedReaction(
    () => enabled.value,
    isEnabled => {
      runOnJS(toggleFrameCallback)(isEnabled);
    }
  );

  // AUTO SCROLL HANDLER
  // Automatically scrolls the container when the active item is near the edge
  useAnimatedReaction(
    () => {
      const itemOffset = activeItemPosition.value?.y;
      if (
        !enabled.value ||
        activeItemHeight.value === -1 ||
        itemOffset === undefined
      ) {
        return null;
      }

      return {
        currentOffset: currentScrollOffset.value,
        itemHeight: activeItemHeight.value,
        itemOffset,
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

  const updateStartScrollOffset = useCallback(() => {
    'worklet';
    dragStartScrollOffset.value = currentScrollOffset.value;
  }, [dragStartScrollOffset, currentScrollOffset]);

  return {
    children: (
      <View collapsable={false} ref={containerRef}>
        {children}
      </View>
    ),
    value: {
      currentScrollOffset,
      dragStartScrollOffset,
      updateStartScrollOffset
    }
  };
});

export { AutoScrollProvider, useAutoScrollContext };
