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
import { resolveDimension } from '../../../utils';
import { createProvider } from '../../utils';
import { useCommonValuesContext } from '../CommonValuesProvider';
import { ContinuousModeUpdater } from './modes';
import useDebugHelpers from './useDebugHelpers';
import {
  calculateRawProgressHorizontal,
  calculateRawProgressVertical
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
            currentScrollOffset={currentScrollOffset}
            dragStartScrollOffset={dragStartScrollOffset}
            isVertical={isVertical}
            {...(props as Required<AutoScrollSettingsInternal>)}
          />
        )}
      </>
    ),
    value: {
      scrollOffsetDiff
    }
  };
});

type AutoScrollUpdaterProps = AutoScrollSettingsInternal & {
  currentScrollOffset: SharedValue<number>;
  dragStartScrollOffset: SharedValue<null | number>;
  isVertical: boolean;
};

function AutoScrollUpdater(props: AutoScrollUpdaterProps) {
  const {
    autoScrollActivationOffset,
    autoScrollExtrapolation,
    currentScrollOffset,
    dragStartScrollOffset,
    isVertical,
    scrollableRef
  } = props;

  const {
    activeItemKey,
    containerRef,
    indexToKey,
    itemHeights,
    itemPositions,
    itemWidths,
    touchPosition
  } = useCommonValuesContext();

  const targetScrollOffset = useMutableValue<null | number>(null);

  const progress = useMutableValue(0);

  const scrollAxis = isVertical ? 'y' : 'x';
  const itemAxisSizes = isVertical ? itemHeights : itemWidths;
  const activationOffset: [number, number] = Array.isArray(
    autoScrollActivationOffset
  )
    ? autoScrollActivationOffset
    : [autoScrollActivationOffset, autoScrollActivationOffset];

  let debug: ReturnType<typeof useDebugHelpers> = {};
  if (__DEV__) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    debug = useDebugHelpers(isVertical, activationOffset);
  }

  const contentBounds = useDerivedValue<[number, number] | null>(() => {
    const firstKey = indexToKey.value[0];
    const lastKey = indexToKey.value[indexToKey.value.length - 1];
    if (
      activeItemKey.value === null ||
      firstKey === undefined ||
      lastKey === undefined
    ) {
      return null;
    }

    const firstPosition = itemPositions.value[firstKey];
    const lastPosition = itemPositions.value[lastKey];
    const lastItemSize = resolveDimension(itemAxisSizes.value, lastKey);
    if (!firstPosition || !lastPosition || lastItemSize === null) {
      return null;
    }

    return [firstPosition[scrollAxis], lastPosition[scrollAxis] + lastItemSize];
  });

  const calculateRawProgress = isVertical
    ? calculateRawProgressVertical
    : calculateRawProgressHorizontal;

  useAnimatedReaction(
    () => {
      let position = touchPosition.value?.[scrollAxis] ?? null;
      if (position !== null && targetScrollOffset.value !== null) {
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
      // TODO - take autoScrollMaxOverscroll into account
      const targetOffset = (targetScrollOffset.value = Math.max(
        currentScrollOffset.value + distance,
        0
      ));

      if (Math.abs(targetOffset - currentScrollOffset.value) < 1) {
        return;
      }

      scrollTo(
        scrollableRef,
        isVertical ? 0 : targetOffset,
        isVertical ? targetOffset : 0,
        animated
      );
    },
    [currentScrollOffset, targetScrollOffset, isVertical, scrollableRef]
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
