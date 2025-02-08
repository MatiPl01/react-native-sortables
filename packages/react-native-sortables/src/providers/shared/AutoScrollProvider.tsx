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
    activeItemPosition,
    containerRef,
    itemDimensions,
    touchPosition
  } = useCommonValuesContext();
  const debugContext = useDebugContext();

  const debugRects = debugContext?.useDebugRects(['top', 'bottom']);
  const debugLine = debugContext?.useDebugLine();

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const scrollOffset = useScrollViewOffset(scrollableRef);
  const targetScrollOffset = useSharedValue(-1);
  const dragStartScrollOffset = useAnimatableValue(-1);
  const startContainerPageY = useSharedValue(-1);
  const prevScrollToOffset = useSharedValue(-1);

  const activeItemHeight = useDerivedValue(() => {
    const key = activeItemKey.value;
    return key ? (itemDimensions.value[key]?.height ?? -1) : -1;
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
    if (!isFrameCallbackActive.value) {
      return;
    }
    const currentOffset = scrollOffset.value;
    const targetOffset = targetScrollOffset.value;
    const diff = targetOffset - currentOffset;

    if (Math.abs(diff) < OFFSET_EPS || targetOffset === -1) {
      targetScrollOffset.value = -1;
      return;
    }

    const direction = diff > 0 ? 1 : -1;
    const step = speed.value * direction * Math.sqrt(Math.abs(diff));
    const nextOffset =
      targetOffset > currentOffset
        ? Math.min(currentOffset + step, targetOffset)
        : Math.max(currentOffset + step, targetOffset);

    if (
      Math.abs(nextOffset - currentOffset) < OFFSET_EPS ||
      prevScrollToOffset.value === nextOffset
    ) {
      targetScrollOffset.value = -1;
      return;
    }

    scrollTo(scrollableRef, 0, nextOffset, false);
    prevScrollToOffset.value = nextOffset;
  }, false);

  // TODO - improve auto scroll later on
  const lastUpdateScrollOffset = useSharedValue(0);
  useAnimatedReaction(
    () => scrollOffset.value,
    offset => {
      if (touchPosition.value) {
        touchPosition.value = {
          x: touchPosition.value.x,
          y: touchPosition.value.y + (offset - lastUpdateScrollOffset.value)
        };
        lastUpdateScrollOffset.value = offset;
      }
    }
  );

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
      targetScrollOffset.value = -1;
      startContainerPageY.value = -1;
      prevScrollToOffset.value = -1;
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
        activeItemHeight.value === -1 ||
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

      if (!scrollableMeasurements || !containerMeasurements) {
        hideDebugViews();
        return;
      }

      const { threshold, touchOffset } = props;
      const { height: sH, pageY: sY } = scrollableMeasurements;
      const { height: cH, pageY: cY } = containerMeasurements;

      if (startContainerPageY.value === -1) {
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
    (providedOffset?: number) => {
      'worklet';
      dragStartScrollOffset.value = providedOffset ?? scrollOffset.value;
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
