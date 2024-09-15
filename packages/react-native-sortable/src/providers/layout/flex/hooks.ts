import { useAnimatedReaction } from 'react-native-reanimated';

import { useDebugContext } from '../../../debug';
import type { Coordinate, Dimension } from '../../../types';
import { reorderItems } from '../../../utils';
import { useCommonValuesContext, useOrderUpdater } from '../../shared';
import { useFlexLayoutContext } from './FlexLayoutProvider';

export function useFlexOrderUpdater(): void {
  const {
    activeItemKey,
    indexToKey,
    itemDimensions,
    itemPositions,
    keyToIndex
  } = useCommonValuesContext();
  const { crossAxisGroupOffsets, flexDirection, itemGroups, keyToGroup } =
    useFlexLayoutContext();

  const debugContext = useDebugContext();

  const debugRects = debugContext?.useDebugRects([
    'top',
    'bottom',
    'left',
    'right'
  ]);

  useAnimatedReaction(
    () => activeItemKey.value,
    () => {
      if (debugRects && activeItemKey.value === null) {
        Object.values(debugRects).forEach(rect => rect.hide());
      }
    }
  );

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

  useOrderUpdater(
    ({ activeIndex, activeKey, position, strategy, touchPosition }) => {
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
        touchPosition[crossCoordinate] < offsetBefore
      ) {
        groupIndex -= 1;
        offsetBefore = crossAxisGroupOffsets.value[groupIndex];
      }

      let offsetAfter = crossAxisGroupOffsets.value[groupIndex + 1];
      while (
        offsetAfter !== undefined &&
        groupIndex < itemGroups.value.length &&
        touchPosition[crossCoordinate] > offsetAfter
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
        const otherPosition = itemPositions.value[key];
        if (!otherPosition) {
          continue;
        }

        // Item before the active item in the group
        if (otherPosition[mainCoordinate] < position[mainCoordinate]) {
          const otherEnd =
            otherPosition[mainCoordinate] + otherDimensions[mainDimension];
          if (otherEnd > touchPosition[mainCoordinate]) {
            overlappingItemKey = key;
            break;
          }
        }

        // Item after the active item in the group
        if (otherPosition[mainCoordinate] > position[mainCoordinate]) {
          const otherStart = otherPosition[mainCoordinate];
          if (otherStart < touchPosition[mainCoordinate]) {
            overlappingItemKey = key;
            break;
          }
        }
      }

      if (overlappingItemKey === undefined) {
        return;
      }
      const overlappingIndex = keyToIndex.value[overlappingItemKey];
      if (overlappingIndex === undefined) {
        return;
      }

      // Return the new order of items
      return reorderItems(
        indexToKey.value,
        activeIndex,
        overlappingIndex,
        strategy
      );
    },
    [mainCoordinate, crossCoordinate, mainDimension, crossDimension]
  );
}
