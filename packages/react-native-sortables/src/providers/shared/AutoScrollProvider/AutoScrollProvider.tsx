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
  calculateRawProgressVertical,
  clampDistance
} from './utils';

// Maximum elapsed time multiplier to prevent excessive scrolling distances when app lags
const MAX_ELAPSED_TIME_MULTIPLIER = 2;
const MIN_ELAPSED_TIME_CAP = 100;

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
  const currentScrollOffset = useScrollViewOffset(scrollableRef);
  const dragStartScrollOffset = useMutableValue<null | number>(null);
  const contentBounds = useMutableValue<[Vector, Vector] | null>(null);

  const isVertical = autoScrollDirection === 'vertical';

  const scrollOffsetDiff = useDerivedValue(() => {
    if (dragStartScrollOffset.value === null) {
      return null;
    }

    return {
      [isVertical ? 'y' : 'x']:
        currentScrollOffset.value - dragStartScrollOffset.value
    };
  });

  const scrollBy = useCallback(
    (distance: number, animated: boolean) => {
      'worklet';
      const offset = currentScrollOffset.value + distance;
      scrollTo(
        scrollableRef,
        isVertical ? 0 : offset,
        isVertical ? offset : 0,
        animated
      );
    },
    [scrollableRef, isVertical, currentScrollOffset]
  );

  return {
    children: (
      <>
        {children}
        {enabled && (
          <AutoScrollUpdater
            {...rest}
            contentBounds={contentBounds}
            currentScrollOffset={currentScrollOffset}
            dragStartScrollOffset={dragStartScrollOffset}
            isVertical={isVertical}
            scrollableRef={scrollableRef}
          />
        )}
      </>
    ),
    enabled,
    value: {
      contentBounds,
      scrollableRef,
      scrollBy,
      scrollOffsetDiff
    }
  };
});

type StateContextType = {
  targetScrollOffset: null | number;
  prevContainerOffset: null | number;
  lastUpdateTimestamp: null | number;
};

const INITIAL_STATE: StateContextType = {
  lastUpdateTimestamp: null,
  prevContainerOffset: null,
  targetScrollOffset: null
};

type AutoScrollUpdaterProps = Omit<
  AutoScrollSettings,
  'autoScrollDirection' | 'autoScrollEnabled'
> & {
  currentScrollOffset: SharedValue<number>;
  dragStartScrollOffset: SharedValue<null | number>;
  contentBounds: SharedValue<[Vector, Vector] | null>;
  isVertical: boolean;
};

function AutoScrollUpdater({
  animateScrollTo,
  autoScrollActivationOffset,
  autoScrollExtrapolation,
  autoScrollInterval,
  autoScrollMaxOverscroll,
  autoScrollMaxVelocity,
  contentBounds,
  currentScrollOffset,
  dragStartScrollOffset,
  isVertical,
  scrollableRef
}: AutoScrollUpdaterProps) {
  const { activeAnimationProgress, containerRef, touchPosition } =
    useCommonValuesContext();

  const progress = useMutableValue(0);
  const context = useMutableValue<StateContextType>(INITIAL_STATE);

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

  let debug: ReturnType<typeof useDebugHelpers> = {};
  if (__DEV__) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    debug = useDebugHelpers(
      isVertical,
      activationOffset,
      contentAxisBounds,
      maxOverscroll
    );
  }

  const calculateRawProgress = isVertical
    ? calculateRawProgressVertical
    : calculateRawProgressHorizontal;

  useAnimatedReaction(
    () => {
      const ctx = context.value;
      let position = touchPosition.value?.[scrollAxis] ?? null;
      if (position !== null && ctx.targetScrollOffset !== null) {
        // Sometimes the scroll distance is so small that the scrollTo takes
        // no effect. To handle this case, we have to update the position
        // of the view used to determine the progress, even if the actual
        // position of the view is not changed (because of too small scroll distance).
        position += ctx.targetScrollOffset - currentScrollOffset.value;
      }
      return position;
    },
    position => {
      if (position === null) {
        context.value.targetScrollOffset = null;
        debug?.hideDebugViews?.();
        return;
      }

      const contentContainerMeasurements = measure(containerRef);
      const scrollContainerMeasurements = measure(scrollableRef);
      if (!contentContainerMeasurements || !scrollContainerMeasurements) {
        debug?.hideDebugViews?.();
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

      if (progress.value === 0) {
        context.value.targetScrollOffset = null;
      }

      debug?.updateDebugRects?.(
        contentContainerMeasurements,
        scrollContainerMeasurements
      );
    },
    [debug]
  );

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
        pendingDistance !== 0 &&
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
      if (progress.value === 0) {
        return;
      }

      const ctx = context.value;
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

  const frameCallback = useFrameCallback(frameCallbackFunction, false);

  const toggleFrameCallback = useCallback(
    (enabled: boolean) => {
      frameCallback.setActive(enabled);
    },
    [frameCallback]
  );

  useAnimatedReaction(
    () => isActive.value,
    active => {
      if (active) {
        dragStartScrollOffset.value = currentScrollOffset.value;
        const ctx = context.value;
        ctx.lastUpdateTimestamp = null;
        ctx.targetScrollOffset = null;
        ctx.prevContainerOffset = null;
        runOnJS(toggleFrameCallback)(true);
      } else {
        dragStartScrollOffset.value = null;
        runOnJS(toggleFrameCallback)(false);
      }
    },
    [currentScrollOffset]
  );

  return null;
}

export { AutoScrollProvider, useAutoScrollContext };
