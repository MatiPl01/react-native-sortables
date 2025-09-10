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
import {
  calculateRawProgressHorizontal,
  calculateRawProgressVertical
} from './utils';

// Maximum elapsed time multiplier to prevent excessive scrolling distances when app lags
const MAX_ELAPSED_TIME_MULTIPLIER = 2;
const MIN_ELAPSED_TIME_CAP = 100;

type StateContextType = {
  lastScrollToOffset: null | number;
  autoScroll: null | {
    lastUpdateTimestamp?: number;
    startContainerOffset: number;
    targetContainerOffset: number;
  };
};

const INITIAL_STATE: StateContextType = {
  autoScroll: null,
  lastScrollToOffset: null
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
  const scrollOffset = useScrollViewOffset(scrollableRef);

  const scrollOffsetDiff = useMutableValue(0);
  const contentBounds = useMutableValue<[Vector, Vector] | null>(null);
  const context = useMutableValue(INITIAL_STATE);

  const isVertical = autoScrollDirection === 'vertical';

  const scrollToOffset = useCallback(
    (offset: number, animated: boolean) => {
      'worklet';
      const lastOffset = context.value.lastScrollToOffset;

      if (lastOffset !== null && Math.abs(offset - lastOffset) < 1) {
        return;
      }

      scrollTo(
        scrollableRef,
        isVertical ? 0 : offset,
        isVertical ? offset : 0,
        animated
      );
    },
    [context, isVertical, scrollableRef]
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

  return {
    children: (
      <>
        {children}
        {enabled && (
          <AutoScrollUpdater
            {...rest}
            contentBounds={contentBounds}
            context={context}
            isVertical={isVertical}
            scrollableRef={scrollableRef}
            scrollOffset={scrollOffset}
            scrollOffsetDiff={scrollOffsetDiff}
            scrollToOffset={scrollToOffset}
          />
        )}
      </>
    ),
    enabled,
    value: {
      contentBounds,
      isVerticalScroll: isVertical,
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
  context: SharedValue<StateContextType>;
  scrollOffset: SharedValue<number>;
  scrollOffsetDiff: SharedValue<number>;
  contentBounds: SharedValue<[Vector, Vector] | null>;
  isVertical: boolean;
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
  isVertical,
  scrollableRef,
  scrollOffset,
  scrollToOffset
}: AutoScrollUpdaterProps) {
  const { activeAnimationProgress, containerRef, touchPosition } =
    useCommonValuesContext();

  const progress = useMutableValue(0);

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
      const bounds = contentAxisBounds.value;
      const containerMeasurements = measure(containerRef);
      const scrollableMeasurements = measure(scrollableRef);
      if (!bounds || !scrollableMeasurements || !containerMeasurements) {
        return;
      }

      const ctx = context.value;
      const pendingDistance =
        ctx.targetScrollOffset !== null
          ? ctx.targetScrollOffset - currentScrollOffset.value
          : 0;

      const containerOffset = isVertical
        ? scrollableMeasurements.pageY - containerMeasurements.pageY
        : scrollableMeasurements.pageX - containerMeasurements.pageX;
      const scrollableCrossSize = isVertical
        ? scrollableMeasurements.height
        : scrollableMeasurements.width;

      if (
        Math.abs(pendingDistance) > 1 &&
        containerOffset === ctx.prevContainerOffset
      ) {
        // Return if measurements haven't been updated yet (we scroll based on the
        // relative position of the container in the ScrollView so we have to ensure
        // that the last update is already applied)
        return;
      }

      const clampedDistance = clampDistance(
        distance + pendingDistance,
        containerOffset,
        scrollableCrossSize,
        bounds,
        maxOverscroll
      );

      const targetOffset = currentScrollOffset.value + clampedDistance;

      ctx.targetScrollOffset = targetOffset;

      if (Math.abs(clampedDistance) < 1) {
        return;
      }

      ctx.prevContainerOffset = containerOffset;
      scrollTo(
        scrollableRef,
        isVertical ? 0 : targetOffset,
        isVertical ? targetOffset : 0,
        animated
      );
    },
    [
      context,
      currentScrollOffset,
      isVertical,
      scrollableRef,
      containerRef,
      contentAxisBounds,
      maxOverscroll
    ]
  );

  const frameCallbackFunction = useCallback(
    ({ timestamp }: FrameInfo) => {
      'worklet';
      const ctx = context.value;
      if (!ctx || progress.value === 0) {
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
        progress.value,
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
      progress,
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
      lastUpdateTimestamp: null,
      startScrollOffset: scrollOffset.value
    };
    runOnJS(toggleFrameCallback)(true);
  }, [context, scrollOffset, toggleFrameCallback]);

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

  const calculateRawProgress = isVertical
    ? calculateRawProgressVertical
    : calculateRawProgressHorizontal;

  useAnimatedReaction(
    () => touchPosition.value?.[scrollAxis],
    position => {
      if (position === undefined) {
        disableAutoScroll();
        return;
      }

      progress.value = calculateRawProgress(
        position,
        contentContainerMeasurements,
        scrollContainerMeasurements,
        activationOffset,
        maxOverscroll,
        autoScrollExtrapolation
      );

      if (debug) {
        const contentContainerMeasurements = measure(containerRef);
        const scrollContainerMeasurements = measure(scrollableRef);

        if (!contentContainerMeasurements || !scrollContainerMeasurements) {
          debug?.hideDebugViews?.();
          return;
        }

        debug?.updateDebugRects?.(
          contentContainerMeasurements,
          scrollContainerMeasurements
        );
      }
    },
    [debug]
  );

  return null;
}

export { AutoScrollProvider, useAutoScrollContext };
