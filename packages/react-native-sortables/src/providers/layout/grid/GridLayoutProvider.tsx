import { type PropsWithChildren, useCallback } from 'react';
import {
  type SharedValue,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue
} from 'react-native-reanimated';

import { IS_WEB } from '../../../constants';
import { useDebugContext } from '../../../debug';
import { useAnimatableValue } from '../../../hooks';
import type {
  Animatable,
  GridLayout,
  GridLayoutContextType
} from '../../../types';
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
}>;

const { GridLayoutProvider, useGridLayoutContext } = createProvider(
  'GridLayout'
)<GridLayoutProviderProps, GridLayoutContextType>(({
  columnGap: columnGap_,
  isVertical,
  numGroups,
  numItems,
  rowGap: rowGap_
}) => {
  const {
    indexToKey,
    itemDimensions,
    itemPositions,
    itemsStyleOverride,
    measuredContainerHeight,
    measuredContainerWidth,
    shouldAnimateLayout
  } = useCommonValuesContext();
  const { applyControlledContainerDimensions } = useMeasurementsContext();
  const debugContext = useDebugContext();

  const debugGroupGapRects = debugContext?.useDebugRects(
    Math.ceil(numItems / numGroups) - 1
  );
  const debugGroupItemGapRects = debugContext?.useDebugRects(numGroups - 1);

  const columnGap = useAnimatableValue(columnGap_);
  const rowGap = useAnimatableValue(rowGap_);

  const mainGap = isVertical ? columnGap : rowGap;
  const crossGap = isVertical ? rowGap : columnGap;

  /**
   * Size of the group of items determined by the parent container size.
   * width - in vertical orientation (default) (columns are groups)
   * height - in horizontal orientation (rows are groups)
   */
  const mainGroupSize = useSharedValue<null | number>(null);

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
          itemDimensions: itemDimensions.value,
          mainGroupSize: mainGroupSize.value,
          numGroups
        }),
        (props, previousProps) => {
          onChange(
            calculateLayout(props),
            // Animate layout only if parent container is not resized
            // (e.g. skip animation when the browser window is resized)
            IS_WEB &&
              (!previousProps?.mainGroupSize ||
                props.mainGroupSize === previousProps.mainGroupSize)
          );
        }
      ),
    [mainGroupSize, mainGap, crossGap, numGroups, isVertical, itemDimensions]
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
          itemDimensions: itemDimensions.value,
          mainGroupSize: mainGroupSize.value,
          numGroups
        })
      ),
    [mainGroupSize, mainGap, crossGap, numGroups, isVertical, itemDimensions]
  );

  // TARGET COLUMN WIDTH UPDATER
  useAnimatedReaction(
    () => ({
      gap: mainGap.value,
      mainContainerSize: isVertical
        ? measuredContainerWidth.value
        : measuredContainerHeight.value
    }),
    ({ gap, mainContainerSize }) => {
      if (!mainContainerSize) {
        return;
      }

      mainGroupSize.value = (mainContainerSize + gap) / numGroups - gap;

      // DEBUG ONLY
      if (debugGroupGapRects) {
        for (let i = 0; i < numGroups - 1; i++) {
          const size = mainGroupSize.value * (i + 1) + gap * i;

          debugGroupGapRects[i]?.set({
            ...DEBUG_COLORS,
            ...(isVertical ? { height: gap, y: size } : { width: gap, x: size })
          });
        }
      }
    }
  );

  // GRID LAYOUT UPDATER
  useGridLayoutReaction(indexToKey, (layout, shouldAnimate) => {
    'worklet';
    shouldAnimateLayout.value = shouldAnimate;
    if (!layout) {
      return;
    }

    // Update item positions
    itemPositions.value = layout.itemPositions;
    // Update controlled container dimensions
    applyControlledContainerDimensions(layout.calculatedDimensions);
    // Update style overrides
    const currentStyleOverride = itemsStyleOverride.value;
    const mainDimension = isVertical ? 'width' : 'height';
    if (currentStyleOverride?.[mainDimension] !== mainGroupSize.value) {
      itemsStyleOverride.value = {
        [mainDimension]: mainGroupSize.value
      };
    }

    // DEBUG ONLY
    if (debugGroupItemGapRects) {
      for (let i = 0; i < layout.crossAxisOffsets.length - 1; i++) {
        const size = mainGap.value;
        const pos = layout.crossAxisOffsets[i + 1]! - crossGap.value;

        debugGroupItemGapRects[i]?.set({
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
