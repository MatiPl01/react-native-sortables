import { type PropsWithChildren, useCallback } from 'react';
import {
  type SharedValue,
  useAnimatedReaction,
  useDerivedValue
} from 'react-native-reanimated';

import { IS_WEB } from '../../../constants';
import { useDebugContext } from '../../../debug';
import type { Animatable } from '../../../integrations/reanimated';
import {
  useAnimatableValue,
  useMutableValue
} from '../../../integrations/reanimated';
import type { GridLayout, GridLayoutContextType } from '../../../types';
import { useCommonValuesContext, useMeasurementsContext } from '../../shared';
import { createProvider } from '../../utils';
import { calculateLayout } from './utils';

const DEBUG_COLORS = {
  backgroundColor: '#ffa500',
  borderColor: '#825500'
};

type GridLayoutProviderProps = PropsWithChildren<{
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
  columnGap: columnGap_,
  isVertical,
  numGroups,
  numItems,
  rowGap: rowGap_,
  rowHeight
}) => {
  const {
    containerWidth,
    indexToKey,
    itemHeights,
    itemPositions,
    itemWidths,
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

  /**
   * Size of the group of items determined by the parent container size.
   * width - in vertical orientation (default) (columns are groups)
   * height - in horizontal orientation (rows are groups)
   */
  const mainGroupSize = useMutableValue<null | number>(rowHeight ?? null);

  // MAIN GROUP SIZE UPDATER
  useAnimatedReaction(
    () => {
      if (!isVertical) {
        // TODO - check if this is correct for horizontal grids and maybe don't
        // require specifying rowHeight (and instead occupy the entire height
        // of the container)
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

      mainGroupSize.value = value;

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

  const useGridLayoutReaction = useCallback(
    (
      idxToKey: SharedValue<Array<string>>,
      onChange: (layout: GridLayout | null, shouldAnimate: boolean) => void
    ) =>
      useAnimatedReaction(
        () => ({
          gaps: {
            cross: crossGap.value,
            main: mainGap.value
          },
          indexToKey: idxToKey.value,
          isVertical,
          itemHeights: itemHeights.value,
          itemWidths: itemWidths.value,
          mainGroupSize: mainGroupSize.value,
          numGroups
        }),
        (props, previousProps) => {
          onChange(
            calculateLayout(props),
            // On web, animate layout only if parent container is not resized
            // (e.g. skip animation when the browser window is resized)
            !IS_WEB ||
              !previousProps?.mainGroupSize ||
              props.mainGroupSize === previousProps.mainGroupSize
          );
        }
      ),
    [
      mainGroupSize,
      mainGap,
      crossGap,
      numGroups,
      isVertical,
      itemHeights,
      itemWidths
    ]
  );

  const useGridLayout = useCallback(
    (idxToKey: SharedValue<Array<string>>) =>
      useDerivedValue(() =>
        calculateLayout({
          gaps: {
            cross: crossGap.value,
            main: mainGap.value
          },
          indexToKey: idxToKey.value,
          isVertical,
          itemHeights: itemHeights.value,
          itemWidths: itemWidths.value,
          mainGroupSize: mainGroupSize.value,
          numGroups
        })
      ),
    [
      mainGroupSize,
      mainGap,
      crossGap,
      numGroups,
      isVertical,
      itemHeights,
      itemWidths
    ]
  );

  // GRID LAYOUT UPDATER
  useGridLayoutReaction(indexToKey, (layout, shouldAnimate) => {
    'worklet';
    shouldAnimateLayout.value = shouldAnimate;
    if (!layout || mainGroupSize.value === null) {
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
  });

  return {
    value: {
      crossGap,
      isVertical,
      mainGap,
      mainGroupSize,
      numGroups,
      useGridLayout
    }
  };
});

export { GridLayoutProvider, useGridLayoutContext };
