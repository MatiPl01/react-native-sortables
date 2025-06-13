import type { SharedValue } from 'react-native-reanimated';

import type {
  Coordinate,
  Dimension,
  ReorderFunction,
  SortableGridStrategyFactory
} from '../../../../types';
import { getAdditionalSwapOffset, useDebugBoundingBox } from '../../../shared';
import { getCrossIndex, getMainIndex } from '../utils';

export const createGridStrategy =
  (
    useInactiveIndexToKey: () => SharedValue<Array<string>>,
    reorder: ReorderFunction
  ): SortableGridStrategyFactory =>
  ({
    containerHeight,
    containerWidth,
    crossGap,
    fixedItemKeys,
    indexToKey,
    isVertical,
    mainGap,
    mainGroupSize,
    numGroups,
    useGridLayout
  }) => {
    const othersIndexToKey = useInactiveIndexToKey();
    const othersLayout = useGridLayout(othersIndexToKey);
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

    return ({ activeIndex, dimensions, position }) => {
      'worklet';
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
        crossAxisOffsets[index] !== undefined
          ? crossAxisOffsets[index + 1]! -
            crossAxisOffsets[index] -
            crossGap.value
          : 0;

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
        const swapOffset =
          crossIndex > 0
            ? ((crossAxisOffsets[crossIndex - 1] ?? 0) +
                crossBeforeOffset +
                crossCurrentSize) /
              2
            : 0;
        const crossBeforeSize = getItemCrossSize(crossIndex - 1);
        if (crossBeforeSize) {
          const additionalBeforeOffset = getAdditionalSwapOffset(
            crossGap.value,
            crossBeforeSize
          );
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
        crossAfterOffset = nextCrossAxisOffset - crossGap.value;
        const swapOffset =
          ((crossAxisOffsets[crossIndex] ?? 0) +
            nextCrossAxisOffset +
            crossCurrentSize) /
          2;
        const crossAfterSize = getItemCrossSize(crossIndex + 1);
        if (crossAfterSize) {
          const additionalAfterOffset = getAdditionalSwapOffset(
            crossGap.value,
            crossAfterSize
          );
          crossAfterBound = swapOffset + additionalAfterOffset;
          crossCurrentSize = crossAfterSize;
        } else {
          crossAfterBound = swapOffset;
        }
      } while (
        crossAfterBound < crossContainerSize.value &&
        position[crossCoordinate] > crossAfterBound
      );

      // HORIZONTAL BOUNDS
      const additionalOffsetX = getAdditionalSwapOffset(
        mainGap.value,
        mainContainerSize.value
      );

      // Before bound
      let mainBeforeOffset = -Infinity;
      let mainBeforeBound = Infinity;

      do {
        if (mainBeforeBound !== Infinity) {
          mainIndex--;
        }
        mainBeforeOffset = mainIndex * (mainGroupSize.value + mainGap.value);
        mainBeforeBound = mainBeforeOffset - additionalOffsetX;
      } while (
        mainBeforeBound > 0 &&
        position[mainCoordinate] < mainBeforeBound
      );

      // Right bound
      let mainAfterOffset = Infinity;
      let mainAfterBound = -Infinity;

      do {
        if (mainAfterBound !== -Infinity) {
          mainIndex++;
        }
        mainAfterOffset =
          mainIndex * (mainGroupSize.value + mainGap.value) +
          mainGroupSize.value;
        mainAfterBound = mainAfterOffset + additionalOffsetX;
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
      const newIndex = Math.max(
        0,
        Math.min(limitedCrossIndex * numGroups + mainIndex, itemsCount - 1)
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
