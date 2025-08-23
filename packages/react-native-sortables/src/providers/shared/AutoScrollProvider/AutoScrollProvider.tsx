import { type PropsWithChildren } from 'react';
import {
  measure,
  useAnimatedReaction,
  useDerivedValue,
  useScrollViewOffset
} from 'react-native-reanimated';

import type { AutoScrollContextType, AutoScrollSettings } from '../../../types';
import { createProvider } from '../../utils';
import { useCommonValuesContext } from '../CommonValuesProvider';
import useDebugHelpers from './useDebugHelpers';
import {
  calculateRawProgressHorizontal,
  calculateRawProgressVertical
} from './utils';

type AutoScrollProviderProps = PropsWithChildren<AutoScrollSettings>;

const { AutoScrollProvider, useAutoScrollContext } = createProvider(
  'AutoScroll',
  { guarded: false }
)<AutoScrollProviderProps, AutoScrollContextType>(({
  autoScrollEnabled,
  autoScrollMode,
  children,
  ...rest
}) => {
  return {
    children: (
      <>
        {children}
        {autoScrollEnabled && <AutoScrollUpdater {...rest} />}
      </>
    ),
    value: {
      // scrollOffsetDiff,
      // updateStartScrollOffset
    }
  };
});

type AutoScrollUpdaterProps = Omit<AutoScrollSettings, 'autoScrollEnabled'>;

function AutoScrollUpdater({
  autoScrollActivationOffset,
  autoScrollDirection,
  autoScrollSpeed,
  maxScrollToOverflowOffset,
  scrollableRef
}: AutoScrollUpdaterProps) {
  const isVertical = autoScrollDirection === 'vertical';
  const scrollAxis = isVertical ? 'y' : 'x';
  const {
    activeItemKey,
    containerRef,
    indexToKey,
    itemPositions,
    touchPosition
  } = useCommonValuesContext();
  const currentScrollOffset = useScrollViewOffset(scrollableRef);

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
    if (!firstPosition || !lastPosition) {
      return null;
    }

    return [firstPosition[scrollAxis], lastPosition[scrollAxis]];
  });

  const calculateRawProgress = isVertical
    ? calculateRawProgressVertical
    : calculateRawProgressHorizontal;

  // TODO - maybe use frame callback (or only for continuous mode) to calculate
  // progress properly including the time difference between frames
  useAnimatedReaction(
    () => ({
      bounds: contentBounds.value,
      position: touchPosition.value?.[scrollAxis] ?? null,
      scrollOffset: currentScrollOffset.value
    }),
    ({ bounds, position, scrollOffset }) => {
      if (!bounds || position === null || scrollOffset === null) {
        debug?.hideDebugViews?.();
        return;
      }

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
    },
    [debug]
  );

  return null;
}

export { AutoScrollProvider, useAutoScrollContext };
