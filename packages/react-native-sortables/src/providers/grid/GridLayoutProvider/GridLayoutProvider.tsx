import { type PropsWithChildren, useCallback } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import { useAnimatedReaction } from 'react-native-reanimated';

import { IS_WEB } from '../../../constants';
import { useDebugContext } from '../../../debug';
import {
  setAnimatedTimeout,
  useMutableValue
} from '../../../integrations/reanimated';
import type { GridLayout, GridLayoutContextType, Vector } from '../../../types';
import {
  useAutoScrollContext,
  useCommonValuesContext,
  useMeasurementsContext
} from '../../shared';
import { createProvider } from '../../utils';
import { useAutoOffsetAdjustmentContext } from '../AutoOffsetAdjustmentProvider';
import {
  calculateLayout,
  shiftLayoutInCrossAxis,
  shouldUpdateContainerDimensions
} from './utils';

const DEBUG_COLORS = {
  backgroundColor: '#ffa500',
  borderColor: '#825500'
};

export type GridLayoutProviderProps = PropsWithChildren<{
  numItems: number;
  numGroups: number;
  isVertical: boolean;
  rowGap: SharedValue<number>;
  columnGap: SharedValue<number>;
  rowHeight?: number;
}>;

const { GridLayoutProvider, useGridLayoutContext } = createProvider(
  'GridLayout'
)<GridLayoutProviderProps, GridLayoutContextType>(({
  columnGap,
  isVertical,
  numGroups,
  numItems,
  rowGap,
  rowHeight
}) => {
  const {
    containerHeight,
    containerWidth,
    indexToKey,
    itemHeights,
    itemPositions,
    itemWidths,
    shouldAnimateLayout
  } = useCommonValuesContext();
  const { applyControlledContainerDimensions } = useMeasurementsContext();
  const { additionalCrossOffset, calculateOffsetShift } =
    useAutoOffsetAdjustmentContext() ?? {};
  const { contentBounds, scrollBy } = useAutoScrollContext() ?? {};
  const debugContext = useDebugContext();

  const appliedLayout = useMutableValue<GridLayout | null>(null);

  const debugMainGapRects = debugContext?.useDebugRects(numGroups - 1);
  const debugCrossGapRects = debugContext?.useDebugRects(
    Math.ceil(numItems / numGroups) - 1
  );

  const mainGap = isVertical ? columnGap : rowGap;
  const crossGap = isVertical ? rowGap : columnGap;

  // MAIN GROUP SIZE UPDATER
  useAnimatedReaction(
    () => {
      if (!isVertical) {
        // TODO - maybe don't require specifying rowHeight (and instead
        // occupy the entire height of the container)
        return rowHeight ?? null;
      }

      return containerWidth.value
        ? (containerWidth.value + mainGap.value) / numGroups - mainGap.value
        : null;
    },
    value => {
      if (!value) {
        return;
      }

      if (isVertical) {
        itemWidths.value = value;
      } else {
        itemHeights.value = value;
      }

      // DEBUG ONLY
      if (debugMainGapRects) {
        const gap = mainGap.value;

        for (let i = 0; i < numGroups - 1; i++) {
          const pos = value * (i + 1) + gap * i;

          debugMainGapRects[i]?.set({
            ...DEBUG_COLORS,
            ...(isVertical ? { width: gap, x: pos } : { height: gap, y: pos })
          });
        }
      }
    }
  );

  const applyLayout = useCallback(
    (layout: GridLayout, shouldAnimate: boolean) => {
      'worklet';
      shouldAnimateLayout.value = shouldAnimate;
      itemPositions.value = layout.itemPositions;

      if (
        shouldUpdateContainerDimensions(
          isVertical ? containerHeight.value : containerWidth.value,
          layout.containerCrossSize,
          (layout.crossAxisOffsets[0] ?? 0) > 0
        )
      ) {
        applyControlledContainerDimensions({
          [isVertical ? 'height' : 'width']: layout.containerCrossSize
        });
      }

      if (contentBounds) {
        const crossCoordinate = isVertical ? 'y' : 'x';
        const mainCoordinate = isVertical ? 'x' : 'y';

        contentBounds.value = [
          {
            [crossCoordinate]: layout.crossAxisOffsets[0] ?? 0,
            [mainCoordinate]: 0
          } as Vector,
          {
            [crossCoordinate]:
              layout.crossAxisOffsets[layout.crossAxisOffsets.length - 1] ?? 0,
            [mainCoordinate]: isVertical
              ? containerWidth.value
              : containerHeight.value
          } as Vector
        ];
      }

      // DEBUG ONLY
      if (debugCrossGapRects) {
        for (let i = 0; i < layout.crossAxisOffsets.length - 1; i++) {
          const size = crossGap.value;
          const pos = layout.crossAxisOffsets[i + 1]! - crossGap.value;

          debugCrossGapRects[i]?.set({
            ...DEBUG_COLORS,
            ...(isVertical ? { height: size, y: pos } : { width: size, x: pos })
          });
        }
      }

      appliedLayout.value = layout;
    },
    [
      appliedLayout,
      applyControlledContainerDimensions,
      containerHeight,
      containerWidth,
      contentBounds,
      crossGap,
      debugCrossGapRects,
      itemPositions,
      isVertical,
      shouldAnimateLayout
    ]
  );

  // GRID LAYOUT UPDATER
  useAnimatedReaction(
    () => ({
      gaps: {
        cross: crossGap.value,
        main: mainGap.value
      },
      indexToKey: indexToKey.value,
      isVertical,
      itemHeights: itemHeights.value,
      itemWidths: itemWidths.value,
      numGroups
    }),
    (props, previousProps) => {
      const additionalOffset = additionalCrossOffset?.value ?? 0;

      const layout = calculateLayout(props, additionalOffset);
      if (!layout) {
        return;
      }

      // On the web, animate layout only if parent container is not resized
      // (e.g. skip animation when the browser window is resized)
      const shouldAnimate =
        !IS_WEB ||
        !previousProps?.itemHeights ||
        !previousProps?.itemWidths ||
        isVertical
          ? props.itemWidths === previousProps?.itemWidths
          : props.itemHeights === previousProps?.itemHeights;

      const maybeOffsetShift =
        previousProps &&
        calculateOffsetShift?.(layout.itemPositions, itemPositions.value);

      if (maybeOffsetShift && appliedLayout.value && scrollBy) {
        console.log('[1] layout');
        scrollBy(maybeOffsetShift, true);
        applyLayout(
          shiftLayoutInCrossAxis(
            appliedLayout.value,
            isVertical ? 'y' : 'x',
            maybeOffsetShift
          ),
          false
        );
        // Delay the application of the new layout in order to immediately shift
        // items with the old layout when they change from collapsed to expanded
        setAnimatedTimeout(() => applyLayout(layout, true), 100);
      } else {
        console.log('[2] layout');
        applyLayout(layout, shouldAnimate);
      }
    }
  );

  return {
    value: {
      crossGap,
      isVertical,
      mainGap,
      numGroups
    }
  };
});

export { GridLayoutProvider, useGridLayoutContext };
