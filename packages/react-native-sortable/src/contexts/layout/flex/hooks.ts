import type { Coordinate, Dimension, ReorderStrategy } from '../../../types';
import { reorderItems } from '../../../utils';
import { useActiveItemReaction } from '../../hooks';
import { useMeasurementsContext, usePositionsContext } from '../../shared';
import { useFlexLayoutContext } from './FlexLayoutProvider';

export function useFlexOrderUpdater(strategy: ReorderStrategy): void {
  const { itemDimensions } = useMeasurementsContext();
  const { indexToKey, keyToIndex, targetItemPositions } = usePositionsContext();
  const { crossAxisGroupOffsets, flexDirection, itemGroups, keyToGroup } =
    useFlexLayoutContext();

  let mainCoordinate: Coordinate = 'x';
  let crossCoordinate: Coordinate = 'y';
  let mainDimension: Dimension = 'width';
  let crossDimension: Dimension = 'height';

  if (flexDirection.startsWith('column')) {
    mainCoordinate = 'y';
    crossCoordinate = 'x';
    mainDimension = 'height';
    crossDimension = 'width';
  }

  useActiveItemReaction(
    ({ activeIndex, activeKey, centerPosition, position }) => {
      'worklet';
      let groupIndex = keyToGroup.value[activeKey];
      if (groupIndex === undefined) {
        return;
      }

      // Select the group in which the active item is currently located
      let offsetBefore = crossAxisGroupOffsets.value[groupIndex];
      while (
        offsetBefore !== undefined &&
        groupIndex >= 0 &&
        centerPosition[crossCoordinate] < offsetBefore
      ) {
        groupIndex -= 1;
        offsetBefore = crossAxisGroupOffsets.value[groupIndex];
      }

      let offsetAfter = crossAxisGroupOffsets.value[groupIndex + 1];
      while (
        offsetAfter !== undefined &&
        groupIndex < itemGroups.value.length &&
        centerPosition[crossCoordinate] > offsetAfter
      ) {
        groupIndex += 1;
        offsetAfter = crossAxisGroupOffsets.value[groupIndex + 1];
      }

      // Check if the active item center is overlapping with another item
      // within the same group
      let overlappingItemKey: string | undefined;
      const group = itemGroups.value[groupIndex];
      if (!group) {
        return;
      }
      for (const key of group) {
        if (key === activeKey) {
          continue;
        }

        const otherDimensions = itemDimensions.value[key];
        if (!otherDimensions) {
          continue;
        }
        const otherPosition = targetItemPositions.current[key];
        if (!otherPosition) {
          continue;
        }
        const otherMainPosition = otherPosition[mainCoordinate].value;
        if (otherMainPosition === null) {
          continue;
        }

        // Item before the active item in the group
        if (otherMainPosition < position[mainCoordinate]) {
          const otherEnd = otherMainPosition + otherDimensions[mainDimension];
          if (otherEnd > centerPosition[mainCoordinate]) {
            overlappingItemKey = key;
            break;
          }
        }
        // Item after the active item in the group
        if (otherMainPosition > position[mainCoordinate]) {
          const otherStart = otherMainPosition;
          if (otherStart < centerPosition[mainCoordinate]) {
            overlappingItemKey = key;
            break;
          }
        }
      }

      if (overlappingItemKey === undefined) {
        return;
      }
      const overlappingIndex = keyToIndex.current[overlappingItemKey]?.value;
      if (overlappingIndex === undefined) {
        return;
      }

      // Update the order of items
      indexToKey.value = reorderItems(
        indexToKey.value,
        activeIndex,
        overlappingIndex,
        strategy
      );
    },
    [mainCoordinate, crossCoordinate, mainDimension, crossDimension, strategy]
  );
}
