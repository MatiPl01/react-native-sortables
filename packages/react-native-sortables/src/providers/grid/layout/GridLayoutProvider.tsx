import { type PropsWithChildren } from 'react';
import Animated, { useAnimatedReaction } from 'react-native-reanimated';

import { IS_WEB } from '../../../constants';
import { useDebugContext } from '../../../debug';
import type { Animatable } from '../../../integrations/reanimated';
import {
  useAnimatableValue,
  useMutableValue
} from '../../../integrations/reanimated';
import type { GridLayoutContextType } from '../../../types';
import { useCommonValuesContext, useMeasurementsContext } from '../../shared';
import { createProvider } from '../../utils';
import { calculateActiveItemCrossOffset, calculateLayout } from './utils';

const DEBUG_COLORS = {
  backgroundColor: '#ffa500',
  borderColor: '#825500'
};

export type GridLayoutProviderProps = PropsWithChildren<{
  numItems: number;
  numGroups: number;
  isVertical: boolean;
  rowGap: Animatable<number>;
  columnGap: Animatable<number>;
  rowHeight?: number;
}>;

const { GridLayoutProvider, useGridLayoutContext } = createProvider(
  'GridLayout'
)<GridLayoutProviderProps, GridLayoutContextType>(({
  children,
  columnGap: columnGap_,
  isVertical,
  numGroups,
  numItems,
  rowGap: rowGap_,
  rowHeight
}) => {
  const {
    activeItemKey,
    containerWidth,
    indexToKey,
    itemHeights,
    itemPositions,
    itemWidths,
    keyToIndex,
    shouldAnimateLayout
  } = useCommonValuesContext();
  const { applyControlledContainerDimensions } = useMeasurementsContext();
  const debugContext = useDebugContext();

  const debugMainGapRects = debugContext?.useDebugRects(numGroups - 1);
  const debugCrossGapRects = debugContext?.useDebugRects(
    Math.ceil(numItems / numGroups) - 1
  );

  const columnGap = useAnimatableValue(columnGap_);
  const rowGap = useAnimatableValue(rowGap_);

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

  const additionalCrossOffset = useMutableValue(0);

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
      const activeKey = activeItemKey.value;
      if (activeKey !== null) {
        const calculatedOffset = calculateActiveItemCrossOffset(
          activeKey,
          keyToIndex.value,
          itemPositions.value,
          props
        );

        additionalCrossOffset.value = calculatedOffset;
      } else {
        additionalCrossOffset.value = 0;
      }

      const layout = calculateLayout(props, additionalCrossOffset.value);

      // On web, animate layout only if parent container is not resized
      // (e.g. skip animation when the browser window is resized)
      shouldAnimateLayout.value =
        !IS_WEB ||
        !previousProps?.itemHeights ||
        !previousProps?.itemWidths ||
        isVertical
          ? props.itemWidths === previousProps?.itemWidths
          : props.itemHeights === previousProps?.itemHeights;

      if (!layout || !itemHeights.value || !itemWidths.value) {
        return;
      }

      // Update item positions
      itemPositions.value = layout.itemPositions;
      // Update controlled container dimensions
      applyControlledContainerDimensions(layout.controlledContainerDimensions);

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
    }
  );

  return {
    children: (
      <>
        {children}
        {/* TODO - apply the height intelligently */}
        <Animated.View style={{ height: 2000 }} />
      </>
    ),
    value: {
      additionalCrossOffset,
      crossGap,
      isVertical,
      mainGap,
      numGroups
    }
  };
});

export { GridLayoutProvider, useGridLayoutContext };
