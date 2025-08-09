import { useCallback } from 'react';
import {
  runOnJS,
  scrollTo,
  useAnimatedReaction,
  useDerivedValue,
  useFrameCallback,
  useScrollViewOffset
} from 'react-native-reanimated';

import { OFFSET_EPS } from '../../../constants';
import {
  useAnimatableValue,
  useMutableValue
} from '../../../integrations/reanimated';
import type { AutoScrollContextType, AutoScrollSettings } from '../../../types';
import { createProvider } from '../../utils';
import { useCommonValuesContext } from '../CommonValuesProvider';
import useTargetScrollOffset from './useTargetScrollOffset';

const { AutoScrollProvider, useAutoScrollContext } = createProvider(
  'AutoScroll',
  { guarded: false }
)<AutoScrollSettings, AutoScrollContextType>(({
  autoScrollActivationOffset,
  autoScrollDirection,
  autoScrollEnabled,
  autoScrollSpeed,
  maxScrollToOverflowOffset,
  scrollableRef
}) => {
  const isHorizontal = autoScrollDirection === 'horizontal';
  const { activeItemKey } = useCommonValuesContext();

  const scrollOffset = useScrollViewOffset(scrollableRef);
  const dragStartScrollOffset = useAnimatableValue<null | number>(null);
  const prevScrollToOffset = useMutableValue<null | number>(null);
  const scrollOffsetDiff = useDerivedValue(() => {
    if (dragStartScrollOffset.value === null) {
      return null;
    }
    return {
      x: isHorizontal ? scrollOffset.value - dragStartScrollOffset.value : 0,
      y: isHorizontal ? 0 : scrollOffset.value - dragStartScrollOffset.value
    };
  });

  const enabled = useAnimatableValue(autoScrollEnabled);
  const speed = useAnimatableValue(autoScrollSpeed);

  const isFrameCallbackActive = useMutableValue(false);

  const targetScrollOffset = useTargetScrollOffset(
    scrollableRef,
    enabled,
    isHorizontal,
    autoScrollActivationOffset,
    maxScrollToOverflowOffset,
    dragStartScrollOffset
  );

  // SMOOTH SCROLL POSITION UPDATER
  // Updates the scroll position smoothly
  // (quickly at first, then slower if the remaining distance is small)
  const frameCallback = useFrameCallback(
    useCallback(() => {
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

      if (isHorizontal) {
        scrollTo(scrollableRef, nextOffset, 0, false);
      } else {
        scrollTo(scrollableRef, 0, nextOffset, false);
      }
      prevScrollToOffset.value = nextOffset;
    }, [
      isFrameCallbackActive,
      isHorizontal,
      prevScrollToOffset,
      scrollableRef,
      scrollOffset,
      speed,
      targetScrollOffset
    ]),
    false
  );

  const toggleFrameCallback = useCallback(
    (isEnabled: boolean) => frameCallback.setActive(isEnabled),
    [frameCallback]
  );

  // Enable/disable frame callback
  useAnimatedReaction(
    () => ({
      isEnabled: enabled.value,
      itemKey: activeItemKey.value
    }),
    ({ isEnabled, itemKey }) => {
      const shouldBeEnabled = isEnabled && itemKey !== null;
      if (isFrameCallbackActive.value === shouldBeEnabled) {
        return;
      }
      prevScrollToOffset.value = null;
      runOnJS(toggleFrameCallback)(shouldBeEnabled);
      isFrameCallbackActive.value = shouldBeEnabled;
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
      scrollOffsetDiff,
      updateStartScrollOffset
    }
  };
});

export { AutoScrollProvider, useAutoScrollContext };
