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
  const { activeItemKey, containerRef, itemDimensions, touchPosition } =
    useCommonValuesContext();
  const debugContext = useDebugContext();

  const debugRects = debugContext?.useDebugRects(['top', 'bottom']);
  const debugLine = debugContext?.useDebugLine();

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const scrollOffset = useScrollViewOffset(scrollableRef);
  const dragStartScrollOffset = useAnimatableValue<null | number>(null);
  const dragScrollOffsetDiff = useSharedValue(0);

  const activeItemHeight = useDerivedValue(() => {
    const key = activeItemKey.value;
    return key && itemDimensions.value[key]?.height;
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

  const hideDebugViews = useCallback(() => {
    'worklet';
    debugRects?.top?.hide();
    debugRects?.bottom?.hide();
    debugLine?.hide();
  }, [debugLine, debugRects]);

  // SMOOTH SCROLL POSITION UPDATER
  // Updates the scroll position smoothly
  // (quickly at first, then slower if the remaining distance is small)
  const frameCallback = useFrameCallback(() => {
    if (
      activeItemHeight.value === null ||
      touchPosition.value === null ||
      dragStartScrollOffset.value === null
    ) {
      hideDebugViews();
      return;
    }

    const scrollableMeasurements = measure(scrollableRef);
    const containerMeasurements = measure(containerRef);

    if (!scrollableMeasurements || !containerMeasurements) {
      hideDebugViews();
      return;
    }

    const scrollToOffset =
      dragStartScrollOffset.value + dragScrollOffsetDiff.value;
    if (Math.abs(scrollOffset.value - scrollToOffset) > 1) {
      console.log('scrollToOffset', scrollToOffset, scrollOffset.value);
      scrollTo(scrollableRef, 0, scrollToOffset, false);
    }

    const threshold = offsetThreshold.value;
    const touchOffset = touchPosition.value.y;
    const { height: sH, pageY: sY } = scrollableMeasurements;
    const { height: cH, pageY: cY } = containerMeasurements;

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

    const topDistance = sY + threshold.top - cY;
    const bottomDistance = cY + cH - (sY + sH - threshold.bottom);

    const topOverflow = sY + threshold.top - (cY + touchOffset);
    const bottomOverflow = cY + touchOffset - (sY + sH - threshold.bottom);

    const scrollOffsetDiff = scrollOffset.value - dragStartScrollOffset.value;
    // Scroll up
    if (topDistance > 0 && topOverflow > 0) {
      console.log('up dragScrollOffsetDiff.value', dragScrollOffsetDiff.value);
      dragScrollOffsetDiff.value = scrollOffsetDiff - 0.05 * topOverflow;
    }
    // Scroll down
    else if (bottomDistance > 0 && bottomOverflow > 0) {
      console.log(
        'down dragScrollOffsetDiff.value',
        dragScrollOffsetDiff.value
      );
      dragScrollOffsetDiff.value = scrollOffsetDiff + 0.05 * bottomOverflow;
    }
  }, false);

  const toggleFrameCallback = useCallback(
    (isEnabled: boolean) => frameCallback.setActive(isEnabled),
    [frameCallback]
  );

  // Enable/disable frame callback
  useAnimatedReaction(
    () => ({
      activeKey: activeItemKey.value,
      isEnabled: enabled.value
    }),
    ({ activeKey, isEnabled }) => {
      const shouldBeEnabled = isEnabled && activeKey !== null;
      if (isFrameCallbackActive.value === shouldBeEnabled) {
        return;
      }
      runOnJS(toggleFrameCallback)(shouldBeEnabled);
      isFrameCallbackActive.value = shouldBeEnabled;
    }
  );

  const updateStartScrollOffset = useCallback(
    (providedOffset?: null | number) => {
      'worklet';
      dragScrollOffsetDiff.value = 0;
      dragStartScrollOffset.value =
        providedOffset !== undefined ? providedOffset : scrollOffset.value;
    },
    [dragScrollOffsetDiff, dragStartScrollOffset, scrollOffset]
  );

  return {
    value: {
      dragScrollOffsetDiff,
      dragStartScrollOffset,
      scrollOffset,
      updateStartScrollOffset
    }
  };
});

export { AutoScrollProvider, useAutoScrollContext };
