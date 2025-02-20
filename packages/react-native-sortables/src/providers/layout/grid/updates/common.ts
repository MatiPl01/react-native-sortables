import type { SharedValue } from 'react-native-reanimated';

import type {
  Coordinate,
  SortableGridStrategyFactory
} from '../../../../types';
import { getAdditionalSwapOffset, useDebugBoundingBox } from '../../../shared';
import { getCrossIndex, getMainIndex } from '../utils';

export const createGridStrategy =
  (
    useInactiveIndexToKey: () => SharedValue<Array<string>>,
    reorder: (
      indexToKey: Array<string>,
      activeIndex: number,
      newIndex: number
    ) => Array<string>
  ): SortableGridStrategyFactory =>
  ({
    containerHeight,
    containerWidth,
    crossGap,
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

    if (isVertical) {
      mainContainerSize = containerWidth;
      crossContainerSize = containerHeight;
      mainCoordinate = 'x';
      crossCoordinate = 'y';
    } else {
      mainContainerSize = containerHeight;
      crossContainerSize = containerWidth;
      mainCoordinate = 'y';
      crossCoordinate = 'x';
    }

    return ({ activeIndex, position }) => {
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
      let crossIndex = startCrossIndex;
      let mainIndex = startMainIndex;

      // CROSS AXIS BOUNDS
      // Before bound
      let crossBeforeOffset = -Infinity;
      let crossBeforeBound = Infinity;

      do {
        if (crossBeforeBound !== Infinity) {
          crossIndex--;
        }
        crossBeforeOffset = crossAxisOffsets[crossIndex] ?? 0;
        const crossBeforeHeight =
          crossAxisOffsets[crossIndex - 1] !== undefined
            ? crossBeforeOffset -
              crossAxisOffsets[crossIndex - 1]! -
              crossGap.value
            : 0;
        const additionalBeforeOffset = getAdditionalSwapOffset(
          crossGap.value,
          crossBeforeHeight
        );
        crossBeforeBound = crossBeforeOffset - additionalBeforeOffset;
      } while (
        crossBeforeBound > 0 &&
        position[crossCoordinate] < crossBeforeBound
      );

      // After bound
      let crossAfterOffset = Infinity;
      let crossAfterBound = -Infinity;

      do {
        if (crossAfterBound !== -Infinity) {
          crossIndex++;
        }
        const nextCrossAxisOffset = crossAxisOffsets[crossIndex + 1];
        if (!nextCrossAxisOffset) {
          break;
        }
        crossAfterOffset = nextCrossAxisOffset;
        const crossAfterHeight =
          crossAxisOffsets[crossIndex + 2] !== undefined &&
          crossAfterOffset !== undefined
            ? crossAfterOffset - crossAfterOffset - crossGap.value
            : 0;
        const additionalAfterOffset = getAdditionalSwapOffset(
          crossGap.value,
          crossAfterHeight
        );
        crossAfterBound =
          crossAfterOffset - crossGap.value + additionalAfterOffset;
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
            { x: mainAfterBound, y: crossBeforeOffset }
          );
          debugBox.bottom.update(
            { x: mainBeforeBound, y: crossAfterOffset },
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
            { x: crossAfterBound, y: mainAfterBound }
          );
          debugBox.bottom.update(
            { x: crossBeforeBound, y: mainAfterBound },
            { x: crossAfterBound, y: mainBeforeBound }
          );
          debugBox.left.update(
            { x: crossBeforeBound, y: mainBeforeBound },
            { x: crossAfterBound, y: mainAfterBound }
          );
          debugBox.right.update(
            { x: crossBeforeBound, y: mainAfterBound },
            { x: crossAfterBound, y: mainBeforeBound }
          );
        }
      }

      // Swap the active item with the item at the new index
      const itemsCount = indexToKey.value.length;
      const limitedCrossIndex = Math.max(
        0,
        Math.min(crossIndex, Math.floor((itemsCount - 1) / numGroups))
      );
      const newIndex = Math.max(
        0,
        Math.min(limitedCrossIndex * numGroups + mainIndex, itemsCount - 1)
      );
      if (newIndex === activeIndex) {
        return;
      }

      // return the new order of items
      return reorder(indexToKey.value, activeIndex, newIndex);
    };
  };
