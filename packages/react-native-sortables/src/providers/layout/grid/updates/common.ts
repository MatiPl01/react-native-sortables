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

      // Swap the active item with the item at the new index
      const idxToKey = indexToKey.value;
      const itemsCount = idxToKey.length;
      const limitedCrossIndex = Math.max(
        0,
        Math.min(crossIndex, Math.floor((itemsCount - 1) / numGroups))
      );
      const newIndex = Math.max(0, limitedCrossIndex * numGroups + mainIndex);

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
