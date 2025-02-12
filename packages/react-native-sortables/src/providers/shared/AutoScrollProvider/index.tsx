import { useCallback } from 'react';
import {
  runOnJS,
  scrollTo,
  useAnimatedReaction,
  useDerivedValue,
  useFrameCallback,
  useScrollViewOffset,
  useSharedValue
} from 'react-native-reanimated';

import { OFFSET_EPS } from '../../../constants';
import { useAnimatableValue } from '../../../hooks';
import type { AutoScrollContextType, AutoScrollSettings } from '../../../types';
import { createProvider } from '../../utils';
import { useCommonValuesContext } from '../CommonValuesProvider';
import { useTargetScrollOffset } from './hooks';

const { AutoScrollProvider, useAutoScrollContext } = createProvider(
  'AutoScroll',
  { guarded: false }
)<AutoScrollSettings, AutoScrollContextType>(({
  autoScrollActivationOffset,
  autoScrollEnabled,
  autoScrollSpeed,
  autoScrollDirection,
  scrollableRef
}) => {
  const isHorizontal = autoScrollDirection === 'horizontal';
  const { activeItemKey } = useCommonValuesContext();

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const scrollOffset = useScrollViewOffset(scrollableRef);
  const dragStartScrollOffset = useAnimatableValue<null | number>(null);
  const prevScrollToOffset = useSharedValue<null | number>(null);
  const scrollOffsetDiff = useDerivedValue(() => {
    if (dragStartScrollOffset.value === null) {
      return null;
    }
    return {
      x: scrollOffset.value - dragStartScrollOffset.value,
      y: 0
    };
  });

  const enabled = useAnimatableValue(autoScrollEnabled);
  const speed = useAnimatableValue(autoScrollSpeed);

  const isFrameCallbackActive = useSharedValue(false);

  const targetScrollOffset = useTargetScrollOffset(
    scrollableRef,
    enabled,
    isHorizontal,
    autoScrollActivationOffset,
    dragStartScrollOffset
  );

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

    if (isHorizontal) {
      scrollTo(scrollableRef, nextOffset, 0, false);
    } else {
      scrollTo(scrollableRef, 0, nextOffset, false);
    }
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
