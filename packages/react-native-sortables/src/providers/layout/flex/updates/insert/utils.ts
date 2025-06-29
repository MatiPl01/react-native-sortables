import type { Dimension, Dimensions } from '../../../../../types';
import { reorderInsert } from '../../../../../utils';

export type ItemGroupSwapProps = {
  activeItemKey: string;
  activeItemIndex: number; // can be in different group than the currentGroupIndex
  currentGroupIndex: number;
  groupSizeLimit: number;
  indexToKey: Array<string>;
  keyToIndex: Record<string, number>;
  itemDimensions: Record<string, Dimensions>;
  itemGroups: Array<Array<string>>;
  mainDimension: Dimension;
  mainGap: number;
  fixedKeys: Record<string, boolean> | undefined;
};

export type ItemGroupSwapResult = {
  indexToKey: Array<string>;
  itemIndex: number;
  itemIndexInGroup: number;
  groupIndex: number;
};

const getGroupItemIndex = (
  inGroupIndex: number,
  group: Array<string>,
  keyToIndex: Record<string, number>
) => {
  'worklet';
  const key = group[inGroupIndex]!;
  if (key === undefined) return null;
  return keyToIndex[key] ?? null;
};

export const getTotalGroupSize = (
  group: Array<string>,
  itemDimensions: Record<string, Dimensions>,
  mainDimension: Dimension,
  gap: number
) => {
  'worklet';

  const sizesSum = group.reduce(
    (total, key) => total + (itemDimensions[key]?.[mainDimension] ?? 0),
    0
  );

  return sizesSum + gap * (group.length - 1);
};

const getIndexesWhenSwappedToGroupBefore = ({
  activeItemKey,
  currentGroupIndex,
  fixedKeys,
  groupSizeLimit,
  itemDimensions,
  itemGroups,
  keyToIndex,
  mainDimension,
  mainGap
}: ItemGroupSwapProps): null | Omit<ItemGroupSwapResult, 'indexToKey'> => {
  'worklet';
  if (groupSizeLimit === Infinity) {
    return null;
  }

  const activeMainSize = itemDimensions[activeItemKey]?.[mainDimension] ?? 0;

  for (let groupIdx = currentGroupIndex; groupIdx > 0; groupIdx--) {
    const groupBefore = itemGroups[groupIdx - 1]!;
    const firstInGroupBeforeIndex = getGroupItemIndex(
      0,
      groupBefore,
      keyToIndex
    );
    const lastInGroupBeforeIndex = getGroupItemIndex(
      groupBefore.length - 1,
      groupBefore,
      keyToIndex
    );

    if (firstInGroupBeforeIndex === null || lastInGroupBeforeIndex === null) {
      return null;
    }

    let itemIndex = firstInGroupBeforeIndex;

    const groupBeforeBefore = itemGroups[groupIdx - 2];
    if (groupBeforeBefore) {
      // If there is a group before the group before the active group,
      // we have to check whether the active item won't wrap to this group
      const totalGroupBeforeBeforeSize = getTotalGroupSize(
        groupBeforeBefore,
        itemDimensions,
        mainDimension,
        mainGap
      );
      const canBeFirstInGroupBefore =
        totalGroupBeforeBeforeSize + activeMainSize > groupSizeLimit;
      if (!canBeFirstInGroupBefore) {
        itemIndex++;
      }
    }

    for (; itemIndex <= lastInGroupBeforeIndex; itemIndex++) {
      const itemIndexInGroup = itemIndex - firstInGroupBeforeIndex;
      if (!fixedKeys?.[groupBefore[itemIndexInGroup]!]) {
        return { groupIndex: groupIdx - 1, itemIndex, itemIndexInGroup };
      }
    }
  }

  return null;
};

const getIndexesWhenSwappedToGroupAfter = ({
  activeItemKey,
  currentGroupIndex,
  fixedKeys,
  groupSizeLimit,
  indexToKey,
  itemDimensions,
  itemGroups,
  keyToIndex,
  mainDimension,
  mainGap
}: ItemGroupSwapProps): null | Omit<ItemGroupSwapResult, 'indexToKey'> => {
  'worklet';
  const activeGroup = itemGroups[currentGroupIndex];
  if (groupSizeLimit === Infinity || activeGroup === undefined) {
    return null;
  }

  const firstInActiveGroupIndex = getGroupItemIndex(0, activeGroup, keyToIndex);

  if (firstInActiveGroupIndex === null) {
    return null;
  }

  // We need to remove the active item from the its group, fit all items
  // in the remaining space between the active item's group and the target group,
  // and then insert the active item in the target group
  const activeItemIndex = keyToIndex[activeItemKey]!;
  const activeMainSize = itemDimensions[activeItemKey]?.[mainDimension] ?? 0;
  let totalGroupSize = 0;
  let groupIndex = currentGroupIndex;
  let firstInGroupIndex = firstInActiveGroupIndex;

  for (
    let itemIndex = firstInActiveGroupIndex;
    itemIndex < indexToKey.length;
    itemIndex++
  ) {
    const key = indexToKey[itemIndex]!;
    const itemMainSize = itemDimensions[key]?.[mainDimension] ?? 0;

    if (itemIndex < activeItemIndex) {
      // Items before the active one will remain unchanged, so we just have
      // to add their main size to the total group size
      totalGroupSize += itemMainSize + mainGap;
      continue;
    }

    if (itemIndex === activeItemIndex) {
      continue;
    }

    if (itemMainSize > groupSizeLimit - totalGroupSize) {
      // If the currently checked item doesn't fit in the group, wrap
      // it to the next group and update the group index
      firstInGroupIndex = itemIndex;
      totalGroupSize = 0;
      groupIndex++;
    }
    totalGroupSize += itemMainSize + mainGap;

    if (!fixedKeys?.[key]) {
      const nextItemKey = indexToKey[itemIndex + 1];
      const nextItemMainSize =
        (nextItemKey !== undefined
          ? itemDimensions[nextItemKey]?.[mainDimension]
          : null) ?? null;
      const remainingGroupSize = groupSizeLimit - totalGroupSize;

      if (
        activeMainSize > remainingGroupSize &&
        (nextItemMainSize === null || nextItemMainSize > remainingGroupSize)
      ) {
        // If the active item doesn't fit in the current group,
        // check if it can be wrapped to the next group (It can if there is
        // no next item or if the next item doesn't fit in the group as well.
        // If the next item fits in the group, move it to this group first
        // and check if the active item can be inserted in the next iteration)
        return {
          groupIndex: groupIndex + 1,
          itemIndex,
          itemIndexInGroup: 0
        };
      } else if (groupIndex > currentGroupIndex) {
        // Otherwise, if the active item fits in the group and the group
        // is already below the current group
        return {
          groupIndex,
          itemIndex,
          itemIndexInGroup: itemIndex - firstInGroupIndex
        };
      }
    }
  }

  return null;
};

export const getSwappedToGroupBeforeIndices = (
  props: ItemGroupSwapProps
): ItemGroupSwapResult | null => {
  'worklet';
  const indexes = getIndexesWhenSwappedToGroupBefore(props);
  if (indexes === null) return null;

  return {
    ...indexes,
    indexToKey: reorderInsert(
      props.indexToKey,
      props.activeItemIndex,
      indexes.itemIndex,
      props.fixedKeys
    )
  };
};

export const getSwappedToGroupAfterIndices = (
  props: ItemGroupSwapProps
): ItemGroupSwapResult | null => {
  'worklet';
  const indexes = getIndexesWhenSwappedToGroupAfter(props);
  if (indexes === null) return null;

  return {
    ...indexes,
    indexToKey: reorderInsert(
      props.indexToKey,
      props.activeItemIndex,
      indexes.itemIndex,
      props.fixedKeys
    )
  };
};
