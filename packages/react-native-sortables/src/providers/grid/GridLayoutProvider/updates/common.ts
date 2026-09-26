import {
  type SharedValue,
  useAnimatedReaction,
  useDerivedValue
} from 'react-native-reanimated';

import { useMutableValue } from '../../../../integrations/reanimated';
import type {
  Coordinate,
  Dimension,
  ItemSizes,
  ReorderFunction,
  SortStrategyFactory
} from '../../../../types';
import {
  getAdditionalSwapOffset,
  useCommonValuesContext,
  useCustomHandleContext,
  useDebugBoundingBox
} from '../../../shared';
import { useAutoOffsetAdjustmentContext } from '../../AutoOffsetAdjustmentProvider';
import { useGridLayoutContext } from '../GridLayoutProvider';
import { calculateLayout, getCrossIndex, getMainIndex } from '../utils';

export const createGridStrategy =
  (
    useInactiveIndexToKey: () => SharedValue<Array<string>>,
    reorder: ReorderFunction
  ): SortStrategyFactory =>
  () => {
    const {
      activeItemKey,
      containerHeight,
      containerWidth,
      indexToKey,
      itemHeights,
      itemWidths
    } = useCommonValuesContext();
    const { crossGap, isVertical, mainGap, mainGroupSize, numGroups } =
      useGridLayoutContext();
    const { additionalCrossOffset } = useAutoOffsetAdjustmentContext() ?? {};
    const { fixedItemKeys } = useCustomHandleContext() ?? {};

    const othersIndexToKey = useInactiveIndexToKey();
    const debugBox = useDebugBoundingBox();

    // Cross sizes captured at each drag start. Used to detect a mid-drag size
    // change (e.g. items collapsing on drag start) that is still in flight
    // before the auto offset is applied - see the gate in the order updater.
    // Re-captured on every drag start (activeItemKey null -> key), so it stays
    // correct even when the same item is dragged twice in a row.
    const dragStartCrossSizes = useMutableValue<ItemSizes>(null);

    useAnimatedReaction(
      () => activeItemKey.value,
      key => {
        if (key !== null) {
          dragStartCrossSizes.value = isVertical
            ? itemHeights.value
            : itemWidths.value;
        }
      }
    );

    const othersLayout = useDerivedValue(() =>
      calculateLayout({
        gaps: {
          cross: crossGap.value,
          main: mainGap.value
        },
        indexToKey: othersIndexToKey.value,
        isVertical,
        itemHeights: itemHeights.value,
        itemWidths: itemWidths.value,
        numGroups,
        startCrossOffset: additionalCrossOffset?.value ?? 0
      })
    );

    let mainContainerSize: SharedValue<null | number>;
    let crossContainerSize: SharedValue<null | number>;
    let mainCoordinate: Coordinate;
    let crossCoordinate: Coordinate;
    let crossDimension: Dimension;

    if (isVertical) {
      mainContainerSize = containerWidth;
      crossContainerSize = containerHeight;
      mainCoordinate = 'x';
      crossCoordinate = 'y';
      crossDimension = 'height';
    } else {
      mainContainerSize = containerHeight;
      crossContainerSize = containerWidth;
      mainCoordinate = 'y';
      crossCoordinate = 'x';
      crossDimension = 'width';
    }

    return ({ activeIndex, dimensions, position }) => {
      'worklet';
      // While the auto offset is enabled (additionalCrossOffset defined) but not
      // yet applied (value still null), hold ordering only during a mid-drag
      // size transition - when the cross sizes changed since the drag started.
      // In that window othersLayout (new sizes, offset 0) is inconsistent with
      // the on-screen layout and the finger position, so the bounds walk would
      // fire a far-jump reorder that the offset block then anchors on. Ordering
      // resumes as soon as the offset is applied. Drags with no size change
      // (uniform or already-collapsed items) are unaffected - the snapshot
      // stays reference-equal, so ordering works from the first move.
      const currentCrossSizes = isVertical
        ? itemHeights.value
        : itemWidths.value;
      if (
        additionalCrossOffset &&
        additionalCrossOffset.value === null &&
        dragStartCrossSizes.value !== currentCrossSizes
      ) {
        return;
      }

      if (
        !othersLayout.value ||
        crossContainerSize.value === null ||
        mainContainerSize.value === null ||
        mainGroupSize.value === null
      ) {
        return;
      }

      const { crossAxisOffsets } = othersLayout.value;
      const startCrossIndex = getCrossIndex(activeIndex, numGroups);
      const startMainIndex = getMainIndex(activeIndex, numGroups);
      const startCrossSize = dimensions[crossDimension];
      let crossIndex = startCrossIndex;
      let mainIndex = startMainIndex;

      const getItemCrossSize = (index: number) =>
        crossAxisOffsets[index] !== undefined &&
        crossAxisOffsets[index + 1] !== undefined
          ? crossAxisOffsets[index + 1]! -
            crossAxisOffsets[index] -
            crossGap.value
          : null;

      // CROSS AXIS BOUNDS
      // Before bound
      let crossBeforeOffset = -Infinity;
      let crossBeforeBound = Infinity;
      let crossCurrentSize = startCrossSize;

      do {
        if (crossBeforeBound !== Infinity) {
          crossIndex--;
        }
        crossBeforeOffset = crossAxisOffsets[crossIndex] ?? 0;
        const crossBeforeSize = getItemCrossSize(crossIndex - 1);
        if (crossBeforeSize) {
          const swapOffset =
            ((crossAxisOffsets[crossIndex - 1] ?? 0) +
              crossBeforeOffset +
              crossCurrentSize) /
            2;
          const additionalBeforeOffset =
            getAdditionalSwapOffset(crossBeforeSize);
          crossBeforeBound = swapOffset - additionalBeforeOffset;
          crossCurrentSize = crossBeforeSize;
        } else {
          crossBeforeBound = 0;
        }
      } while (
        crossBeforeBound > 0 &&
        position[crossCoordinate] < crossBeforeBound
      );

      // After bound
      let crossAfterOffset = Infinity;
      let crossAfterBound = -Infinity;
      crossCurrentSize = startCrossSize;

      do {
        if (crossAfterBound !== -Infinity) {
          crossIndex++;
        }
        const nextCrossAxisOffset = crossAxisOffsets[crossIndex + 1];
        if (!nextCrossAxisOffset) {
          break;
        }
        crossAfterOffset =
          (crossAxisOffsets[crossIndex] ?? 0) + crossCurrentSize;
        const crossAfterSize = getItemCrossSize(crossIndex + 1);
        const swapOffset = (crossAfterOffset + nextCrossAxisOffset) / 2;
        const additionalAfterOffset = getAdditionalSwapOffset(crossAfterSize);
        crossAfterBound = swapOffset + additionalAfterOffset;
        if (crossAfterSize) {
          crossCurrentSize = crossAfterSize;
        }
      } while (
        crossAfterBound < crossContainerSize.value &&
        position[crossCoordinate] > crossAfterBound
      );

      // MAIN AXIS BOUNDS
      const additionalOffset = getAdditionalSwapOffset(mainContainerSize.value);

      // Before bound
      let mainBeforeOffset = -Infinity;
      let mainBeforeBound = Infinity;

      do {
        if (mainBeforeBound !== Infinity) {
          mainIndex--;
        }
        mainBeforeOffset = mainIndex * (mainGroupSize.value + mainGap.value);
        mainBeforeBound = mainBeforeOffset - additionalOffset;
      } while (
        mainBeforeBound > 0 &&
        position[mainCoordinate] < mainBeforeBound
      );

      // After bound
      let mainAfterOffset = Infinity;
      let mainAfterBound = -Infinity;

      do {
        if (mainAfterBound !== -Infinity) {
          mainIndex++;
        }
        mainAfterOffset =
          mainIndex * (mainGroupSize.value + mainGap.value) +
          mainGroupSize.value;
        mainAfterBound = mainAfterOffset + additionalOffset;
      } while (
        mainAfterBound < mainContainerSize.value &&
        position[mainCoordinate] > mainAfterBound
      );

      // DEBUG ONLY
      if (debugBox) {
        if (isVertical) {
          debugBox.top.update(
            { x: mainBeforeBound, y: crossBeforeBound },
            {
              x: mainAfterBound,
              y: Math.max(crossBeforeOffset, crossBeforeBound)
            }
          );
          debugBox.bottom.update(
            {
              x: mainBeforeBound,
              y: Math.min(crossAfterOffset, crossAfterBound)
            },
            { x: mainAfterBound, y: crossAfterBound }
          );
          debugBox.left.update(
            { x: mainBeforeBound, y: crossBeforeBound },
            { x: mainBeforeOffset, y: crossAfterBound }
          );
          debugBox.right.update(
            { x: mainAfterOffset, y: crossBeforeBound },
            { x: mainAfterBound, y: crossAfterBound }
          );
        } else {
          debugBox.top.update(
            { x: crossBeforeBound, y: mainBeforeBound },
            { x: crossAfterBound, y: mainBeforeOffset }
          );
          debugBox.bottom.update(
            { x: crossBeforeBound, y: mainAfterBound },
            { x: crossAfterBound, y: mainAfterOffset }
          );
          debugBox.left.update(
            { x: crossBeforeBound, y: mainBeforeBound },
            {
              x: Math.max(crossBeforeOffset, crossBeforeBound),
              y: mainAfterBound
            }
          );
          debugBox.right.update(
            {
              x: Math.min(crossAfterOffset, crossAfterBound),
              y: mainAfterBound
            },
            { x: crossAfterBound, y: mainBeforeBound }
          );
        }
      }

      const idxToKey = indexToKey.value;
      const itemsCount = idxToKey.length;
      const limitedCrossIndex = Math.max(
        0,
        Math.min(crossIndex, Math.floor((itemsCount - 1) / numGroups))
      );
      const newIndex = Math.min(
        Math.max(0, limitedCrossIndex * numGroups + mainIndex),
        itemsCount - 1
      );

      if (
        newIndex === activeIndex ||
        fixedItemKeys?.value[idxToKey[newIndex]!]
      ) {
        return;
      }

      // return the new order of items
      return reorder(idxToKey, activeIndex, newIndex, fixedItemKeys?.value);
    };
  };
