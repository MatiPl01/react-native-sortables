import { type PropsWithChildren, useCallback } from 'react';
import {
  type FrameInfo,
  interpolate,
  measure,
  runOnJS,
  scrollTo,
  type SharedValue,
  useAnimatedReaction,
  useDerivedValue,
  useFrameCallback,
  useScrollViewOffset
} from 'react-native-reanimated';

import { EMPTY_OBJECT } from '../../../constants';
import { useMutableValue } from '../../../integrations/reanimated';
import type {
  AutoScrollContextType,
  AutoScrollSettings,
  Vector
} from '../../../types';
import { toPair } from '../../../utils';
import { createProvider } from '../../utils';
import { useCommonValuesContext } from '../CommonValuesProvider';
import useDebugHelpers from './useDebugHelpers';
import { calculateRawProgress } from './utils';

// Maximum elapsed time multiplier to prevent excessive scrolling distances when app lags
const MAX_ELAPSED_TIME_MULTIPLIER = 2;
const MIN_ELAPSED_TIME_CAP = 100;

type StateContextType = {
  progress: number;
  sortableOffset: number;
  startScrollOffset: number;
  targetScrollOffset: number;
  lastUpdateTimestamp?: number;
};

type AutoScrollProviderProps = PropsWithChildren<Required<AutoScrollSettings>>;

const { AutoScrollProvider, useAutoScrollContext } = createProvider(
  'AutoScroll',
  { guarded: false }
)<AutoScrollProviderProps, AutoScrollContextType>(({
  autoScrollDirection,
  autoScrollEnabled: enabled,
  children,
  scrollableRef,
  ...rest
}) => {
  const { containerRef } = useCommonValuesContext();
  const scrollOffset = useScrollViewOffset(scrollableRef);

  const context = useMutableValue<null | StateContextType>(null);
  const contentBounds = useMutableValue<[Vector, Vector] | null>(null);

  const scrollOffsetDiff = useDerivedValue(() => {
    const startOffset = context.value?.startScrollOffset;
    if (startOffset === undefined) {
      return 0;
    }
    return scrollOffset.value - startOffset;
  });

  const isVertical = autoScrollDirection === 'vertical';

  const scrollToOffset = useCallback(
    (offset: number, animated: boolean) => {
      'worklet';
      if (Math.abs(offset - scrollOffset.value) < 1) {
        return;
      }
      scrollTo(
        scrollableRef,
        isVertical ? 0 : offset,
        isVertical ? offset : 0,
        animated
      );
    },
    [isVertical, scrollOffset, scrollableRef]
  );

  const scrollBy = useCallback(
    (distance: number, animated: boolean) => {
      'worklet';
      if (Math.abs(distance) < 1) {
        return;
      }
      scrollToOffset(scrollOffset.value + distance, animated);
    },
    [scrollToOffset, scrollOffset]
  );

  const getSortableOffset = useCallback(() => {
    'worklet';
    const containerMeasurements = measure(containerRef);
    const scrollableMeasurements = measure(scrollableRef);

    if (!containerMeasurements || !scrollableMeasurements) {
      return null;
    }

    const prop = isVertical ? 'pageY' : 'pageX';
    const scrollContainerPosition =
      scrollableMeasurements[prop] + scrollOffset.value;
    const sortableContainerPosition = containerMeasurements[prop];

    console.log(containerMeasurements, scrollableMeasurements);

    return sortableContainerPosition - scrollContainerPosition;
  }, [containerRef, scrollableRef, scrollOffset, isVertical]);

  const onContainerLayout = useCallback(() => {
    'worklet';
    if (context.value) {
      context.value.sortableOffset = getSortableOffset() ?? 0;
    }
  }, [context, getSortableOffset]);

  return {
    children: (
      <>
        {children}
        {enabled && (
          <AutoScrollUpdater
            {...rest}
            contentBounds={contentBounds}
            context={context}
            getSortableOffset={getSortableOffset}
            isVertical={isVertical}
            scrollableRef={scrollableRef}
            scrollOffset={scrollOffset}
            scrollToOffset={scrollToOffset}
          />
        )}
      </>
    ),
    enabled,
    value: {
      contentBounds,
      isVerticalScroll: isVertical,
      onContainerLayout,
      scrollableRef,
      scrollBy,
      scrollOffsetDiff
    }
  };
});

type AutoScrollUpdaterProps = Omit<
  AutoScrollSettings,
  'autoScrollDirection' | 'autoScrollEnabled'
> & {
  context: SharedValue<null | StateContextType>;
  scrollOffset: SharedValue<number>;
  contentBounds: SharedValue<[Vector, Vector] | null>;
  isVertical: boolean;
  getSortableOffset: () => void;
  scrollToOffset: (offset: number, animated: boolean) => void;
};

function AutoScrollUpdater({
  animateScrollTo,
  autoScrollActivationOffset,
  autoScrollExtrapolation,
  autoScrollInterval,
  autoScrollMaxOverscroll,
  autoScrollMaxVelocity,
  contentBounds,
  context,
  getSortableOffset,
  isVertical,
  scrollableRef,
  scrollOffset,
  scrollToOffset
}: AutoScrollUpdaterProps) {
  const { activeAnimationProgress, containerRef, touchPosition } =
    useCommonValuesContext();

  const scrollAxis = isVertical ? 'y' : 'x';
  const activationOffset = toPair(autoScrollActivationOffset);
  const [maxStartVelocity, maxEndVelocity] = toPair(autoScrollMaxVelocity);
  const maxOverscroll = toPair(autoScrollMaxOverscroll);

  const isActive = useDerivedValue(() => activeAnimationProgress.value === 1);

  const contentAxisBounds = useDerivedValue<[number, number] | null>(() => {
    if (!contentBounds.value) {
      return null;
    }
    const [start, end] = contentBounds.value;
    return [start[scrollAxis], end[scrollAxis]];
  });

  let debug: ReturnType<typeof useDebugHelpers> = EMPTY_OBJECT;
  if (__DEV__) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    debug = useDebugHelpers(
      isVertical,
      activationOffset,
      contentAxisBounds,
      maxOverscroll
    );
  }

  const scrollBy = useCallback(
    (distance: number, animated: boolean) => {
      'worklet';
      // const ctx = context.value;
      // const bounds = contentAxisBounds.value;
      // const containerMeasurements = measure(containerRef);
      // const scrollableMeasurements = measure(scrollableRef);
      // if (
      //   !ctx ||
      //   !bounds ||
      //   !scrollableMeasurements ||
      //   !containerMeasurements
      // ) {
      //   return;
      // }

      // const newContainerOffset = ctx.targetContainerOffset + distance;

      // if (distance < 0) {
      //   // Scroll up
      // } else if (distance > 0) {
      //   // Scroll down
      // }

      // console.log(ctx.targetContainerOffset, distance, newContainerOffset);

      // ctx.targetContainerOffset = newContainerOffset;
      // const offsetDiff = newContainerOffset - ctx.startContainerOffset;

      // scrollToOffset(ctx.startScrollOffset + offsetDiff, animated);
    },
    [
      context,
      scrollableRef,
      containerRef,
      contentAxisBounds,
      maxOverscroll,
      scrollToOffset
    ]
  );

  const frameCallbackFunction = useCallback(
    ({ timestamp }: FrameInfo) => {
      'worklet';
      const ctx = context.value;
      if (!ctx?.progress) {
        return;
      }

      ctx.lastUpdateTimestamp ??= timestamp;
      const elapsedTime = timestamp - ctx.lastUpdateTimestamp;
      if (elapsedTime < autoScrollInterval) {
        return;
      }

      // Cap the elapsed time to prevent excessive scrolling distances when app lags
      const maxElapsedTime = Math.max(
        autoScrollInterval * MAX_ELAPSED_TIME_MULTIPLIER,
        MIN_ELAPSED_TIME_CAP
      );
      const cappedElapsedTime = Math.min(elapsedTime, maxElapsedTime);
      ctx.lastUpdateTimestamp = timestamp;

      const velocity = interpolate(
        ctx.progress,
        [-1, 0, 1],
        [-maxStartVelocity, 0, maxEndVelocity]
      );

      const distance = velocity * (cappedElapsedTime / 1000);

      scrollBy(distance, animateScrollTo);
    },
    [
      context,
      scrollBy,
      maxStartVelocity,
      maxEndVelocity,
      autoScrollInterval,
      animateScrollTo
    ]
  );

  const frameCallback = useFrameCallback(frameCallbackFunction);

  const toggleFrameCallback = useCallback(
    (enabled: boolean) => {
      frameCallback.setActive(enabled);
    },
    [frameCallback]
  );

  const enableAutoScroll = useCallback(() => {
    'worklet';
    if (context.value) {
      return;
    }

    context.value = {
      progress: 0,
      sortableOffset: getSortableOffset() ?? 0,
      startScrollOffset: scrollOffset.value,
      targetScrollOffset: scrollOffset.value
    };

    runOnJS(toggleFrameCallback)(true);
  }, [context, scrollOffset, toggleFrameCallback, getSortableOffset]);

  const disableAutoScroll = useCallback(() => {
    'worklet';
    if (!context.value) {
      return;
    }
    context.value = null;
    debug?.hideDebugViews?.();
    runOnJS(toggleFrameCallback)(false);
  }, [toggleFrameCallback, context, debug]);

  useAnimatedReaction(
    () => isActive.value,
    active => (active ? enableAutoScroll() : disableAutoScroll()),
    [enableAutoScroll, disableAutoScroll]
  );

  useAnimatedReaction(
    () => ({
      bounds: contentAxisBounds.value,
      ctx: context.value,
      position: touchPosition.value?.[scrollAxis]
    }),
    ({ bounds, ctx, position }) => {
      if (position === undefined || !bounds || !ctx) {
        disableAutoScroll();
        return;
      }

      const scrollableMeasurements = measure(scrollableRef);
      if (!scrollableMeasurements) {
        disableAutoScroll();
        return;
      }

      const containerPos = scrollOffset.value + ctx.sortableOffset;
      ctx.progress = calculateRawProgress(
        position,
        containerPos,
        scrollableMeasurements[isVertical ? 'pageY' : 'pageX'],
        scrollableMeasurements[isVertical ? 'height' : 'width'],
        activationOffset,
        bounds,
        maxOverscroll,
        autoScrollExtrapolation
      );

      // console.log(ctx.progress);

      if (debug) {
        debug?.updateDebugRects?.(containerPos, scrollableMeasurements);
      }
    },
    [debug]
  );

  return null;
}

export { AutoScrollProvider, useAutoScrollContext };
