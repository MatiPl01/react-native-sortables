import type { Coordinate, Dimension } from '../../../types';
import { useCommonValuesContext, useOrderUpdater } from '../../shared';
import { useFlexLayoutContext } from './FlexLayoutProvider';

const SWAP_OFFSET = 10;

export function useFlexOrderUpdater(): void {
  const { indexToKey, itemDimensions, itemPositions, keyToIndex } =
    useCommonValuesContext();
  const {
    crossAxisGroupOffsets,
    crossAxisGroupSizes,
    flexDirection,
    itemGroups,
    keyToGroup
  } = useFlexLayoutContext();

  let crossCoordinate: Coordinate,
    crossDimension: Dimension,
    mainCoordinate: Coordinate,
    mainDimension: Dimension;

  if (flexDirection.startsWith('column')) {
    mainCoordinate = 'y';
    crossCoordinate = 'x';
    mainDimension = 'height';
    crossDimension = 'width';
  } else {
    mainCoordinate = 'x';
    crossCoordinate = 'y';
    mainDimension = 'width';
    crossDimension = 'height';
  }

  useOrderUpdater(
    ({ activeIndex, activeKey, centerPosition, strategy }) => {
      'worklet';

      const activeGroupIndex = keyToGroup.value[activeKey];
      if (activeGroupIndex === undefined) {
        return;
      }

      /**
       * SELECTING THE NEAREST GROUP
       */

      let selectedGroupIndex = activeGroupIndex;

      // Check if the active item should be moved to the previous group
      while (selectedGroupIndex > 0) {
        const currentGroupOffset =
          crossAxisGroupOffsets.value[selectedGroupIndex];
        const prevGroupSize = crossAxisGroupSizes.value[selectedGroupIndex - 1];
        const prevGroupOffset =
          crossAxisGroupOffsets.value[selectedGroupIndex - 1];

        if (
          currentGroupOffset === undefined ||
          prevGroupSize === undefined ||
          prevGroupOffset === undefined
        ) {
          break;
        }

        const swapOffset = Math.max(
          currentGroupOffset - SWAP_OFFSET,
          prevGroupOffset + prevGroupSize / 2
        );

        if (centerPosition[crossCoordinate] >= swapOffset) {
          break;
        }

        selectedGroupIndex--;
      }

      // Check if the active item should be moved to the next group
      while (selectedGroupIndex < itemGroups.value.length - 1) {
        const currentGroupOffset =
          crossAxisGroupOffsets.value[selectedGroupIndex];
        const currentGroupSize = crossAxisGroupSizes.value[selectedGroupIndex];
        const nextGroupSize = crossAxisGroupSizes.value[selectedGroupIndex + 1];
        const nextGroupOffset =
          crossAxisGroupOffsets.value[selectedGroupIndex + 1];

        if (
          currentGroupOffset === undefined ||
          currentGroupSize === undefined ||
          nextGroupSize === undefined ||
          nextGroupOffset === undefined
        ) {
          break;
        }

        const swapOffset = Math.min(
          currentGroupOffset + currentGroupSize / 2 + SWAP_OFFSET,
          nextGroupOffset + nextGroupSize / 2
        );

        if (centerPosition[crossCoordinate] <= swapOffset) {
          break;
        }

        selectedGroupIndex++;
      }

      console.log('selectedGroupIndex', selectedGroupIndex);
    },
    [crossCoordinate]
  );
}
