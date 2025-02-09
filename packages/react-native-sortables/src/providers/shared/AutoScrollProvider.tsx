import { useCallback } from 'react';
import {
  measure,
  runOnJS,
  scrollTo,
  useAnimatedReaction,
  useDerivedValue,
  useFrameCallback,
  useScrollViewOffset,
  useSharedValue
} from 'react-native-reanimated';

import { OFFSET_EPS } from '../../constants';
import { useDebugContext } from '../../debug';
import { useAnimatableValue } from '../../hooks';
import type { AutoScrollContextType, AutoScrollSettings } from '../../types';
import { createProvider } from '../utils';
import { useCommonValuesContext } from './CommonValuesProvider';

const DEBUG_COLORS = {
  backgroundColor: '#CE00B5',
  borderColor: '#4E0044'
};

const { AutoScrollProvider, useAutoScrollContext } = createProvider(
  'AutoScroll',
  { guarded: false }
)<AutoScrollSettings, AutoScrollContextType>(({
  autoScrollActivationOffset,
  autoScrollEnabled,
  autoScrollSpeed,
  scrollableRef
}) => {
  const {
    activeAnimationProgress,
    activeItemKey,
    containerRef,
    itemDimensions,
    touchPosition
  } = useCommonValuesContext();
  const debugContext = useDebugContext();

  const debugRects = debugContext?.useDebugRects(['top', 'bottom']);
  const debugLine = debugContext?.useDebugLine();

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const scrollOffset = useScrollViewOffset(scrollableRef);
  const targetScrollOffset = useSharedValue<null | number>(null);
  const dragStartScrollOffset = useAnimatableValue<null | number>(null);
  const startContainerPageY = useSharedValue<null | number>(null);
  const prevScrollToOffset = useSharedValue<null | number>(null);

  const activeItemHeight = useDerivedValue(() => {
    const key = activeItemKey.value;
    return (key ? itemDimensions.value[key]?.height : null) ?? null;
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

  const isFrameCallbackActive = useSharedValue(false);

  // SMOOTH SCROLL POSITION UPDATER
  // Updates the scroll position smoothly
  // (quickly at first, then slower if the remaining distance is small)
  const frameCallback = useFrameCallback(() => {
    const targetOffset = targetScrollOffset.value;
    if (!isFrameCallbackActive.value || targetOffset === null) {
      return;
    }
    const currentOffset = scrollOffset.value;
    const diff = targetOffset - currentOffset;

    if (Math.abs(diff) < OFFSET_EPS) {
      targetScrollOffset.value = null;
      return;
    }

    const direction = diff > 0 ? 1 : -1;
    const step = speed.value * direction * Math.sqrt(Math.abs(diff));
    const nextOffset =
      targetOffset > currentOffset
        ? Math.min(currentOffset + step, targetOffset)
        : Math.max(currentOffset + step, targetOffset);

    if (
      Math.abs(nextOffset - currentOffset) < 0.1 * OFFSET_EPS ||
      prevScrollToOffset.value === nextOffset
    ) {
      targetScrollOffset.value = null;
      return;
    }

    scrollTo(scrollableRef, 0, nextOffset, false);
    prevScrollToOffset.value = nextOffset;
  }, false);

  const toggleFrameCallback = useCallback(
    (isEnabled: boolean) => frameCallback.setActive(isEnabled),
    [frameCallback]
  );

  // Enable/disable frame callback
  useAnimatedReaction(
    () => ({
      isEnabled: enabled.value,
      itemKey: activeItemKey.value,
      progress: activeAnimationProgress.value
    }),
    ({ isEnabled, itemKey, progress }) => {
      const shouldBeEnabled = isEnabled && itemKey !== null;
      if (
        isFrameCallbackActive.value === shouldBeEnabled ||
        (itemKey !== null && progress < 0.5)
      ) {
        return;
      }
      targetScrollOffset.value = null;
      startContainerPageY.value = null;
      prevScrollToOffset.value = null;
      runOnJS(toggleFrameCallback)(shouldBeEnabled);
      isFrameCallbackActive.value = shouldBeEnabled;
    }
  );

  // AUTO SCROLL HANDLER
  // Automatically scrolls the container when the active item is near the edge
  useAnimatedReaction(
    () => {
      if (
        !enabled.value ||
        activeItemHeight.value === null ||
        !touchPosition.value
      ) {
        return null;
      }

      return {
        itemHeight: activeItemHeight.value,
        threshold: offsetThreshold.value,
        touchOffset: touchPosition.value.y
      };
    },
    props => {
      const hideDebugViews = () => {
        debugRects?.top?.hide();
        debugRects?.bottom?.hide();
        debugLine?.hide();
      };

      if (!props) {
        hideDebugViews();
        return;
      }

      const scrollableMeasurements = measure(scrollableRef);
      const containerMeasurements = measure(containerRef);

      if (
        !scrollableMeasurements ||
        !containerMeasurements ||
        dragStartScrollOffset.value === null
      ) {
        hideDebugViews();
        return;
      }

      const { threshold, touchOffset } = props;
      const { height: sH, pageY: sY } = scrollableMeasurements;
      const { height: cH, pageY: cY } = containerMeasurements;

      if (startContainerPageY.value === null) {
        startContainerPageY.value = cY;
      }

      const topDistance = sY + threshold.top - cY;
      const bottomDistance = cY + cH - (sY + sH - threshold.bottom);

      const topOverflow = sY + threshold.top - (cY + touchOffset);
      const bottomOverflow = cY + touchOffset - (sY + sH - threshold.bottom);

      if (debugRects) {
        debugRects.top.set({
          ...DEBUG_COLORS,
          height: threshold.top,
          y: sY - cY
        });
        debugRects.bottom.set({
          ...DEBUG_COLORS,
          height: threshold.bottom,
          positionOrigin: 'bottom',
          y: sY - cY + sH
        });
      }
      if (debugLine) {
        debugLine.set({
          color: DEBUG_COLORS.backgroundColor,
          y: touchOffset
        });
      }

      const deltaY = startContainerPageY.value - cY;
      const offsetY = dragStartScrollOffset.value + deltaY;
      // Scroll up
      if (topDistance > 0 && topOverflow > 0) {
        targetScrollOffset.value = offsetY - Math.min(topOverflow, topDistance);
      }
      // Scroll down
      else if (bottomDistance > 0 && bottomOverflow > 0) {
        targetScrollOffset.value =
          offsetY + Math.min(bottomOverflow, bottomDistance);
      }
    }
  );

  const updateStartScrollOffset = useCallback(
    (providedOffset?: null | number) => {
      'worklet';
      dragStartScrollOffset.value =
        providedOffset === undefined ? scrollOffset.value : providedOffset;
    },
    [dragStartScrollOffset, scrollOffset]
  );

  return {
    value: {
      dragStartScrollOffset,
      scrollOffset,
      updateStartScrollOffset
    }
  };
});

export { AutoScrollProvider, useAutoScrollContext };
