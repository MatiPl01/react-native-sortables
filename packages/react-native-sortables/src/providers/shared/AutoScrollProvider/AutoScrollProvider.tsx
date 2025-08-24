import { type PropsWithChildren, useCallback } from 'react';
import {
  measure,
  scrollTo,
  type SharedValue,
  useAnimatedReaction,
  useDerivedValue,
  useScrollViewOffset
} from 'react-native-reanimated';

import { useMutableValue } from '../../../integrations/reanimated';
import type {
  AutoScrollContextType,
  AutoScrollSettingsInternal
} from '../../../types';
import { toPair } from '../../../utils';
import { createProvider } from '../../utils';
import { useCommonValuesContext } from '../CommonValuesProvider';
import { ContinuousModeUpdater } from './modes';
import useDebugHelpers from './useDebugHelpers';
import {
  calculateRawProgressHorizontal,
  calculateRawProgressVertical,
  clampDistanceHorizontal,
  clampDistanceVertical
} from './utils';

type AutoScrollProviderProps = PropsWithChildren<
  Required<
    Omit<AutoScrollSettingsInternal, 'autoScrollMode'> & {
      autoScrollMode: AutoScrollSettingsInternal['autoScrollMode'];
    }
  >
>;

const { AutoScrollProvider, useAutoScrollContext } = createProvider(
  'AutoScroll',
  { guarded: false }
)<AutoScrollProviderProps, AutoScrollContextType>(({ children, ...props }) => {
  const currentScrollOffset = useScrollViewOffset(props.scrollableRef);
  const dragStartScrollOffset = useMutableValue<null | number>(null);
  const contentBounds = useMutableValue<[number, number] | null>(null);

  const isVertical = props.autoScrollDirection === 'vertical';

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
        {props.autoScrollEnabled && (
          <AutoScrollUpdater
            contentBounds={contentBounds}
            currentScrollOffset={currentScrollOffset}
            dragStartScrollOffset={dragStartScrollOffset}
            isVertical={isVertical}
            {...(props as Required<AutoScrollSettingsInternal>)}
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

type AutoScrollUpdaterProps = AutoScrollSettingsInternal & {
  currentScrollOffset: SharedValue<number>;
  dragStartScrollOffset: SharedValue<null | number>;
  contentBounds: SharedValue<[number, number] | null>;
  isVertical: boolean;
};

function AutoScrollUpdater(props: AutoScrollUpdaterProps) {
  const {
    autoScrollActivationOffset,
    autoScrollExtrapolation,
    autoScrollMaxOverscroll,
    contentBounds,
    currentScrollOffset,
    dragStartScrollOffset,
    isVertical,
    scrollableRef
  } = props;

  const { activeItemKey, containerRef, touchPosition } =
    useCommonValuesContext();

  const targetScrollOffset = useMutableValue<null | number>(null);
  const progress = useMutableValue(0);

  const scrollAxis = isVertical ? 'y' : 'x';
  const activationOffset = toPair(autoScrollActivationOffset);
  const maxOverscroll = toPair(autoScrollMaxOverscroll);

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

  useAnimatedReaction(
    () => activeItemKey.value !== null,
    active => {
      if (active) {
        dragStartScrollOffset.value = currentScrollOffset.value;
      } else {
        dragStartScrollOffset.value = null;
        targetScrollOffset.value = null;
      }
    },
    [currentScrollOffset]
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

  switch (props.autoScrollMode) {
    case 'continuous':
      return (
        <ContinuousModeUpdater
          {...props}
          progress={progress}
          scrollBy={scrollBy}
        />
      );
    case 'step':
      return null; // <StepModeUpdater {...props} />;
  }
}

export { AutoScrollProvider, useAutoScrollContext };
