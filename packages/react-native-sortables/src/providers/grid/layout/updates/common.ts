import { type SharedValue, useAnimatedReaction } from 'react-native-reanimated';

import { useMutableValue } from '../../../../integrations/reanimated';
import type {
  Coordinate,
  Dimension,
  GridLayout,
  ReorderFunction,
  SortStrategyFactory
} from '../../../../types';
import {
  getAdditionalSwapOffset,
  useCommonValuesContext,
  useCustomHandleContext,
  useDebugBoundingBox
} from '../../../shared';
import { useGridLayoutContext } from '../GridLayoutProvider';
import { calculateLayout, getCrossIndex, getMainIndex } from '../utils';

export const createGridStrategy =
  (
    useInactiveIndexToKey: () => SharedValue<Array<string>>,
    reorder: ReorderFunction
  ): SortStrategyFactory =>
  () => {
    const {
      containerHeight,
      containerWidth,
      indexToKey,
      itemHeights,
      itemPositions,
      itemWidths
    } = useCommonValuesContext();
    const { additionalCrossOffset, crossGap, isVertical, mainGap, numGroups } =
      useGridLayoutContext();
    const { fixedItemKeys } = useCustomHandleContext() ?? {};

    const othersIndexToKey = useInactiveIndexToKey();
    const othersLayout = useMutableValue<GridLayout | null>(null);
    const debugBox = useDebugBoundingBox();

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

    useAnimatedReaction(
      () => ({
        additionalOffset: additionalCrossOffset.value,
        indexToKey: othersIndexToKey.value,
        itemPositions: itemPositions.value
      }),
      props => {
        othersLayout.value = calculateLayout(
          {
            gaps: {
              cross: crossGap.value,
              main: mainGap.value
            },
            indexToKey: props.indexToKey,
            isVertical,
            itemHeights: itemHeights.value,
            itemWidths: itemWidths.value,
            numGroups
          },
          props.additionalOffset
        );
      }
    );

    return ({ activeIndex, dimensions, position }) => {
      'worklet';
      const mainGroupSize = (isVertical ? itemWidths : itemHeights).value;

      if (
        !othersLayout.value ||
        crossContainerSize.value === null ||
        mainContainerSize.value === null ||
        mainGroupSize === null ||
        typeof mainGroupSize !== 'number'
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
        crossAxisOffsets[index] !== undefined
          ? crossAxisOffsets[index + 1] -
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
        mainBeforeOffset = mainIndex * (mainGroupSize + mainGap.value);
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
          mainIndex * (mainGroupSize + mainGap.value) + mainGroupSize;
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

      // Swap the active item with the item at the new index
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
