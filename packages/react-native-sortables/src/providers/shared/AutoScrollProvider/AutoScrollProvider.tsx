import { type PropsWithChildren, useCallback } from 'react';
import {
  type FrameInfo,
  interpolate,
  measure,
  scrollTo,
  type SharedValue,
  useAnimatedReaction,
  useDerivedValue,
  useFrameCallback,
  useScrollViewOffset
} from 'react-native-reanimated';
import { runOnJS } from 'react-native-worklets';

import { useMutableValue } from '../../../integrations/reanimated';
import type { AutoScrollContextType, AutoScrollSettings } from '../../../types';
import { toPair } from '../../../utils';
import { createProvider } from '../../utils';
import { useCommonValuesContext } from '../CommonValuesProvider';
import useDebugHelpers from './useDebugHelpers';
import {
  calculateRawProgressHorizontal,
  calculateRawProgressVertical,
  clampDistanceHorizontal,
  clampDistanceVertical
} from './utils';

// Maximum elapsed time multiplier to prevent excessive scrolling distances when app lags
const MAX_ELAPSED_TIME_MULTIPLIER = 2;

type AutoScrollProviderProps = PropsWithChildren<Required<AutoScrollSettings>>;

const { AutoScrollProvider, useAutoScrollContext } = createProvider(
  'AutoScroll',
  { guarded: false }
)<AutoScrollProviderProps, AutoScrollContextType>(({
  autoScrollDirection,
  autoScrollEnabled,
  children,
  scrollableRef,
  ...rest
}) => {
  const currentScrollOffset = useScrollViewOffset(scrollableRef);
  const dragStartScrollOffset = useMutableValue<null | number>(null);
  const contentBounds = useMutableValue<[number, number] | null>(null);

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

  return {
    children: (
      <>
        {children}
        {autoScrollEnabled && (
          <AutoScrollUpdater
            contentBounds={contentBounds}
            currentScrollOffset={currentScrollOffset}
            dragStartScrollOffset={dragStartScrollOffset}
            isVertical={isVertical}
            scrollableRef={scrollableRef}
            {...rest}
          />
        )}
      </>
    ),
    value: {
      contentBounds,
      scrollOffsetDiff
    }
  };
});

type AutoScrollUpdaterProps = Omit<
  AutoScrollSettings,
  'autoScrollDirection' | 'autoScrollEnabled'
> & {
  currentScrollOffset: SharedValue<number>;
  dragStartScrollOffset: SharedValue<null | number>;
  contentBounds: SharedValue<[number, number] | null>;
  isVertical: boolean;
};

function AutoScrollUpdater({
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
  const { activeItemKey, containerRef, touchPosition } =
    useCommonValuesContext();

  const targetScrollOffset = useMutableValue<null | number>(null);
  const lastUpdateTimestamp = useMutableValue<null | number>(null);
  const progress = useMutableValue(0);

  const scrollAxis = isVertical ? 'y' : 'x';
  const activationOffset = toPair(autoScrollActivationOffset);
  const maxOverscroll = toPair(autoScrollMaxOverscroll);
  const [maxStartVelocity, maxEndVelocity] = toPair(autoScrollMaxVelocity);

  let debug: ReturnType<typeof useDebugHelpers> = {};
  if (__DEV__) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    debug = useDebugHelpers(
      isVertical,
      activationOffset,
      contentBounds,
      maxOverscroll
    );
  }

  let calculateRawProgress, clampDistance;
  if (isVertical) {
    calculateRawProgress = calculateRawProgressVertical;
    clampDistance = clampDistanceVertical;
  } else {
    calculateRawProgress = calculateRawProgressHorizontal;
    clampDistance = clampDistanceHorizontal;
  }

  useAnimatedReaction(
    () => {
      let position = touchPosition.value?.[scrollAxis] ?? null;
      if (position !== null && targetScrollOffset.value !== null) {
        // Sometimes the scroll distance is so small that the scrollTo takes
        // no effect. To handle this case, we have to update the position
        // of the view used to determine the progress, even if the actual
        // position of the view is not changed (because of too small scroll distance).
        position += targetScrollOffset.value - currentScrollOffset.value;
      }

      return {
        bounds: contentBounds.value,
        position
      };
    },
    ({ bounds, position }) => {
      if (!position || !bounds) {
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
        bounds,
        maxOverscroll,
        autoScrollExtrapolation
      );

      debug?.updateDebugRects?.(
        contentContainerMeasurements,
        scrollContainerMeasurements
      );
    },
    [debug]
  );

  const scrollBy = useCallback(
    (distance: number, animated = false) => {
      'worklet';
      const bounds = contentBounds.value;
      const containerMeasurements = measure(containerRef);
      const scrollableMeasurements = measure(scrollableRef);
      if (!bounds || !scrollableMeasurements || !containerMeasurements) {
        return;
      }

      const pendingDistance =
        targetScrollOffset.value !== null
          ? targetScrollOffset.value - currentScrollOffset.value
          : 0;

      const clampedDistance = clampDistance(
        distance + pendingDistance,
        containerMeasurements,
        scrollableMeasurements,
        bounds,
        maxOverscroll
      );

      const targetOffset = currentScrollOffset.value + clampedDistance;
      targetScrollOffset.value = targetOffset;

      if (Math.abs(clampedDistance) < 1) {
        return;
      }

      scrollTo(
        scrollableRef,
        isVertical ? 0 : targetOffset,
        isVertical ? targetOffset : 0,
        animated
      );
    },
    [
      currentScrollOffset,
      targetScrollOffset,
      isVertical,
      scrollableRef,
      containerRef,
      contentBounds,
      clampDistance,
      maxOverscroll
    ]
  );

  const frameCallbackFunction = useCallback(
    ({ timestamp }: FrameInfo) => {
      'worklet';
      if (progress.value === 0) {
        return;
      }

      lastUpdateTimestamp.value ??= timestamp;
      const elapsedTime = timestamp - lastUpdateTimestamp.value;
      if (elapsedTime < autoScrollInterval) {
        return;
      }

      // Cap the elapsed time to prevent excessive scrolling distances when app lags
      const maxElapsedTime = autoScrollInterval * MAX_ELAPSED_TIME_MULTIPLIER;
      const cappedElapsedTime = Math.min(elapsedTime, maxElapsedTime);
      lastUpdateTimestamp.value = timestamp;

      const velocity = interpolate(
        progress.value,
        [-1, 0, 1],
        [-maxStartVelocity, 0, maxEndVelocity]
      );

      const distance = velocity * (cappedElapsedTime / 1000);

      scrollBy(distance, autoScrollInterval > 200);
    },
    [
      scrollBy,
      maxStartVelocity,
      maxEndVelocity,
      progress,
      autoScrollInterval,
      lastUpdateTimestamp
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
    () => activeItemKey.value !== null,
    active => {
      if (active) {
        dragStartScrollOffset.value = currentScrollOffset.value;
        lastUpdateTimestamp.value = null;
        runOnJS(toggleFrameCallback)(true);
      } else {
        dragStartScrollOffset.value = null;
        targetScrollOffset.value = null;
        runOnJS(toggleFrameCallback)(false);
      }
    },
    [currentScrollOffset]
  );

  return null;
}

export { AutoScrollProvider, useAutoScrollContext };
