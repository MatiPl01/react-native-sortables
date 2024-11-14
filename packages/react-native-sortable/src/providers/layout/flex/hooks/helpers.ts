import { useCallback, useMemo } from 'react';
import type { SharedValue } from 'react-native-reanimated';

import { MIN_EXTRA_SWAP_OFFSET } from '../../../../constants';
import type { Coordinate, Dimension } from '../../../../types';
import { useCommonValuesContext } from '../../../shared';
import { useFlexLayoutContext } from '../FlexLayoutProvider';
import type {
  FlexColumnAxisParams,
  FlexDirection,
  FlexRowAxisParams,
  RowFlexDirection
} from '../types';

export function useAxisParams<T extends FlexDirection>(
  flexDirection: T
): T extends RowFlexDirection ? FlexRowAxisParams : FlexColumnAxisParams {
  const { columnGap, rowGap } = useFlexLayoutContext();

  let mainCoordinate: Coordinate = 'x';
  let crossCoordinate: Coordinate = 'y';
  let mainDimension: Dimension = 'width';
  let crossDimension: Dimension = 'height';
  let crossAxisGap: SharedValue<number> = rowGap;
  let mainAxisGap: SharedValue<number> = columnGap;

  if (flexDirection.startsWith('column')) {
    mainCoordinate = 'y';
    crossCoordinate = 'x';
    mainDimension = 'height';
    crossDimension = 'width';
    crossAxisGap = columnGap;
    mainAxisGap = rowGap;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return useMemo(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      ({
        coordinates: {
          cross: crossCoordinate,
          main: mainCoordinate
        },
        dimensions: {
          cross: crossDimension,
          main: mainDimension
        },
        gaps: {
          cross: crossAxisGap,
          main: mainAxisGap
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any,
    [
      crossCoordinate,
      mainCoordinate,
      crossDimension,
      mainDimension,
      crossAxisGap,
      mainAxisGap
    ]
  );
}

export function useItemBoundsProviders() {
  const { indexToKey, itemDimensions, itemPositions, keyToIndex } =
    useCommonValuesContext();
  const { crossAxisGroupOffsets, flexDirection, itemGroups, keyToGroup } =
    useFlexLayoutContext();
  const { coordinates, dimensions, gaps } = useAxisParams(flexDirection);

  const calculateGroupCrossAxisBounds = useCallback(
    (groupIndex: number) => {
      'worklet';
      // ITEM OFFSETS
      const crossOffsetBefore = crossAxisGroupOffsets.value[groupIndex];
      const crossOffsetAfter = crossAxisGroupOffsets.value[groupIndex + 1];
      if (crossOffsetBefore === undefined || crossOffsetAfter === undefined) {
        return;
      }

      // ITEM BOUNDS
      // Cross axis before bound
      const groupBeforeSize =
        crossAxisGroupOffsets.value[groupIndex - 1] !== undefined
          ? crossOffsetBefore -
            crossAxisGroupOffsets.value[groupIndex - 1]! -
            gaps.cross.value
          : 0;
      const additionalCrossOffsetBefore = Math.min(
        gaps.cross.value / 2 + MIN_EXTRA_SWAP_OFFSET,
        gaps.cross.value + groupBeforeSize / 2
      );
      const crossBeforeBound = crossOffsetBefore - additionalCrossOffsetBefore;

      // Cross axis after bound
      const groupAfterSize =
        crossAxisGroupOffsets.value[groupIndex + 2] !== undefined
          ? crossAxisGroupOffsets.value[groupIndex + 2]! -
            crossOffsetAfter -
            gaps.cross.value
          : 0;
      const additionalCrossOffsetAfter = Math.min(
        gaps.cross.value / 2 + MIN_EXTRA_SWAP_OFFSET,
        gaps.cross.value + groupAfterSize / 2
      );
      const crossAfterBound =
        crossOffsetAfter - gaps.cross.value + additionalCrossOffsetAfter;

      return {
        bounds: {
          after: crossAfterBound,
          before: crossBeforeBound
        },
        offsets: {
          after: crossOffsetAfter,
          before: crossOffsetBefore
        }
      };
    },
    [crossAxisGroupOffsets, gaps.cross]
  );

  const getGroupBoundingItems = useCallback(
    (groupIndex: number) => {
      'worklet';
      const groupKeys = itemGroups.value[groupIndex];
      if (!groupKeys) {
        return;
      }
      const firstGroupItemKey = groupKeys[0];
      const lastGroupItemKey = groupKeys[groupKeys.length - 1];
      if (firstGroupItemKey === undefined || lastGroupItemKey === undefined) {
        return;
      }
      const firstGroupItemIndex = keyToIndex.value[firstGroupItemKey];
      const lastGroupItemIndex = keyToIndex.value[lastGroupItemKey];
      if (
        firstGroupItemIndex === undefined ||
        lastGroupItemIndex === undefined
      ) {
        return;
      }
      return {
        indices: {
          first: firstGroupItemIndex,
          last: lastGroupItemIndex
        },
        keys: {
          first: firstGroupItemKey,
          last: lastGroupItemKey
        }
      };
    },
    [itemGroups, keyToIndex]
  );

  const calculateItemInGroupMainAxisBounds = useCallback(
    (itemIndex: number, groupIndex: number) => {
      'worklet';
      const itemKey = indexToKey.value[itemIndex];
      if (itemKey === undefined) {
        return;
      }
      const bounds = getGroupBoundingItems(groupIndex);
      if (!bounds) {
        return;
      }
      const {
        indices: { first: firstIndex, last: lastIndex },
        keys: { first: firstKey, last: lastKey }
      } = bounds;

      const beforeOffset = itemPositions.value[itemKey]?.[coordinates.main];
      const itemSize = itemDimensions.value[itemKey]?.[dimensions.main];

      if (beforeOffset === undefined || itemSize === undefined) {
        return;
      }
      const afterOffset = beforeOffset + itemSize;

      // STEP 1: Determine the positions and sizes of neighboring items
      let itemBeforePosition: number | undefined;
      let itemAfterPosition: number | undefined;
      let itemBeforeSize: number | undefined;
      let itemAfterSize: number | undefined;

      if (itemIndex < firstIndex) {
        // Case 1: Item is before the first item in the group
        itemAfterPosition = itemPositions.value[firstKey]?.[coordinates.main];
        itemAfterSize = itemDimensions.value[firstKey]?.[dimensions.main];
      } else if (itemIndex > lastIndex) {
        // Case 2: Item is after the last item in the group
        itemBeforePosition = itemPositions.value[lastKey]?.[coordinates.main];
        itemBeforeSize = itemDimensions.value[lastKey]?.[dimensions.main];
      } else {
        // Case 3: Item is within the group
        const itemBeforeKey = indexToKey.value[itemIndex - 1];
        const itemAfterKey = indexToKey.value[itemIndex + 1];
        // Item before
        if (itemBeforeKey !== undefined) {
          itemBeforeSize =
            itemDimensions.value[itemBeforeKey]?.[dimensions.main];
          if (itemBeforeSize !== undefined) {
            // Position
            if (keyToGroup.value[itemBeforeKey] === groupIndex) {
              // If item is in the same group, just get the position
              itemBeforePosition =
                itemPositions.value[itemBeforeKey]?.[coordinates.main];
            } else {
              // Otherwise, calculate the position of the item as if it
              // was before the first item in the group
              itemBeforePosition =
                beforeOffset - (itemBeforeSize + gaps.main.value);
            }
          }
        }
        // Item after
        if (itemAfterKey !== undefined) {
          itemAfterSize = itemDimensions.value[itemAfterKey]?.[dimensions.main];
          if (itemAfterSize !== undefined) {
            // Position
            if (keyToGroup.value[itemAfterKey] === groupIndex) {
              // If item is in the same group, just get the position
              itemAfterPosition =
                itemPositions.value[itemAfterKey]?.[coordinates.main];
            } else {
              // Otherwise, calculate the position of the item as if it
              // was after the last item in the group
              itemAfterPosition = afterOffset + gaps.main.value;
            }
          }
        }
      }

      // STEP 2: Calculate the bounds of the item
      let beforeBound: number | undefined;
      let afterBound: number | undefined;

      // Before bound
      if (itemBeforePosition !== undefined && itemBeforeSize !== undefined) {
        const additionalOffset = Math.min(
          gaps.main.value / 2 + MIN_EXTRA_SWAP_OFFSET,
          gaps.main.value + itemBeforeSize / 2
        );
        beforeBound = (itemBeforePosition + afterOffset) / 2 - additionalOffset;
      }
      // After bound
      if (itemAfterPosition !== undefined && itemAfterSize !== undefined) {
        const additionalOffset = Math.min(
          gaps.main.value / 2 + MIN_EXTRA_SWAP_OFFSET,
          gaps.main.value + itemAfterSize / 2
        );
        afterBound = (itemAfterPosition + afterOffset) / 2 + additionalOffset;
      }

      return {
        bounds: {
          after: afterBound,
          before: beforeBound
        },
        offsets: {
          after: afterOffset,
          before: beforeOffset
        }
      };
    },
    [
      coordinates.main,
      dimensions.main,
      gaps.main,
      getGroupBoundingItems,
      itemDimensions,
      itemPositions,
      keyToGroup,
      indexToKey
    ]
  );

  return {
    calculateGroupCrossAxisBounds,
    calculateItemInGroupMainAxisBounds,
    getGroupBoundingItems
  };
}
