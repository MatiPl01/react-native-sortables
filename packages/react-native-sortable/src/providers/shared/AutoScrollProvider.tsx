import { useCallback } from 'react';
import type { SharedValue } from 'react-native-reanimated';
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
import { useAnimatableValue } from '../../hooks';
import type { AutoScrollSettings } from '../../types';
import { createProvider } from '../utils';
import { useCommonValuesContext } from './CommonValuesProvider';

type AutoScrollContextType = {
  scrollOffset: SharedValue<null | number>;
  dragStartScrollOffset: SharedValue<null | number>;
  updateStartScrollOffset: (providedOffset?: null | number) => void;
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
    activationProgress,
    activeItemKey,
    containerRef,
    itemDimensions,
    touchedItemKey,
    touchedItemPosition
  } = useCommonValuesContext();

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const scrollOffset = useScrollViewOffset(scrollableRef);
  const targetScrollOffset = useSharedValue<null | number>(null);
  const dragStartScrollOffset = useAnimatableValue<null | number>(null);

  const activeItemHeight = useDerivedValue(() => {
    const key = activeItemKey.value;
    return key ? (itemDimensions.value[key]?.height ?? null) : null;
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
    if (targetOffset === null) {
      return;
    }

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

    if (Math.abs(nextOffset - currentOffset) < OFFSET_EPS) {
      targetScrollOffset.value = null;
      return;
    }

    scrollTo(scrollableRef, 0, nextOffset, false);
  }, false);

  const toggleFrameCallback = useCallback(
    (isEnabled: boolean) => frameCallback.setActive(isEnabled),
    [frameCallback]
  );

  // Enable/disable frame callback
  useAnimatedReaction(
    () => ({
      isEnabled: enabled.value,
      itemKey: touchedItemKey.value,
      progress: activationProgress.value
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
        !touchedItemPosition.value
      ) {
        return null;
      }

      return {
        itemHeight: activeItemHeight.value,
        itemOffset: touchedItemPosition.value.y,
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

      const { itemHeight, itemOffset, threshold } = props;
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
        targetScrollOffset.value = Math.max(
          0,
          scrollOffset.value - Math.min(topOverflow, topDistance)
        );
      }
      // Scroll down
      else if (bottomDistance > 0 && bottomOverflow > 0) {
        // Unfortunately, we don't have enough information to get the
        // height of the scrollable content, so we cannot limit the target
        // scroll offset to the maximum scrollable offset (as we do for
        // the minimum scroll offset while scrolling up).
        targetScrollOffset.value =
          scrollOffset.value + Math.min(bottomOverflow, bottomDistance);
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
