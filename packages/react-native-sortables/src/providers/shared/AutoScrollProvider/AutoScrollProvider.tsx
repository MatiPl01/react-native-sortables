import type { PropsWithChildren } from 'react';
import {
  measure,
  useAnimatedReaction,
  useDerivedValue,
  useScrollViewOffset
} from 'react-native-reanimated';

import { useDebugContext } from '../../../debug';
import type { AutoScrollContextType, AutoScrollSettings } from '../../../types';
import { createProvider } from '../../utils';
import { useCommonValuesContext } from '../CommonValuesProvider';

const DEBUG_COLORS = {
  backgroundColor: '#CE00B5',
  borderColor: '#4E0044'
};

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
  const debugContext = useDebugContext();

  const debug = !!debugContext;
  const debugRects = debugContext?.useDebugRects(['start', 'end']);

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

  useAnimatedReaction(
    () => ({
      bounds: contentBounds.value,
      position: touchPosition.value?.[scrollAxis] ?? null,
      scrollOffset: currentScrollOffset.value
    }),
    ({ bounds, position, scrollOffset }) => {
      const hideDebugViews = debug
        ? () => {
            debugRects?.start?.hide();
            debugRects?.end?.hide();
          }
        : undefined;

      if (!bounds || position === null || scrollOffset === null) {
        hideDebugViews?.();
        return;
      }

      const contentContainerMeasurements = measure(containerRef);
      const scrollContainerMeasurements = measure(scrollableRef);
      if (!contentContainerMeasurements || !scrollContainerMeasurements) {
        hideDebugViews?.();
        return;
      }

      const { height: cH, pageY: cY } = contentContainerMeasurements;
      const { height: sH, pageY: sY } = scrollContainerMeasurements;

      const relativeOffset = sY - cY;

      if (debugRects) {
        debugRects.start.set({
          ...DEBUG_COLORS,
          height: 100,
          y: relativeOffset
        });
        debugRects.end.set({
          ...DEBUG_COLORS,
          height: 100,
          positionOrigin: 'bottom',
          y: relativeOffset + sH
        });
      }
    },
    [debug]
  );

  return null;
}

export { AutoScrollProvider, useAutoScrollContext };
