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
  keyToIndex: Record<string, number>;
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
  const key = group[inGroupIndex];
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

type SwappedGroupIndexesResult = null | Omit<
  ItemGroupSwapResult,
  'indexToKey' | 'keyToIndex'
>;

const getIndexesWhenSwappedToGroupBefore = ({
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
}: ItemGroupSwapProps): SwappedGroupIndexesResult => {
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
    let totalGroupSize = 0;

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
        const firstItemKey = groupBefore[0];
        if (firstItemKey === undefined) {
          return null;
        }
        totalGroupSize +=
          (itemDimensions[firstItemKey]?.[mainDimension] ?? 0) + mainGap;
        itemIndex++;
      }
    }

    for (; itemIndex <= lastInGroupBeforeIndex; itemIndex++) {
      const itemKey = indexToKey[itemIndex];
      if (itemKey === undefined) {
        return null;
      }
      if (totalGroupSize + activeMainSize > groupSizeLimit) {
        break;
      }

      if (!fixedKeys?.[itemKey]) {
        return {
          groupIndex: groupIdx - 1,
          itemIndex,
          itemIndexInGroup: itemIndex - firstInGroupBeforeIndex
        };
      }

      const itemMainSize = itemDimensions[itemKey]?.[mainDimension] ?? 0;
      totalGroupSize += itemMainSize + mainGap;
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
}: ItemGroupSwapProps): SwappedGroupIndexesResult => {
  'worklet';
  const activeGroup = itemGroups[currentGroupIndex];
  if (groupSizeLimit === Infinity || activeGroup === undefined) {
    return null;
  }

  const firstInActiveGroupIndex = getGroupItemIndex(0, activeGroup, keyToIndex);

  if (firstInActiveGroupIndex === null) {
    return null;
  }

  const getItemMainSize = (key: string) =>
    itemDimensions[key]?.[mainDimension] ?? 0;

  // We need to remove the active item from the its group, fit all items
  // in the remaining space between the active item's group and the target group,
  // and then insert the active item in the target group
  const activeItemIndex = keyToIndex[activeItemKey]!;
  let totalGroupSize = 0;

  for (let i = firstInActiveGroupIndex; i < activeItemIndex; i++) {
    const key = indexToKey[i]!;
    totalGroupSize += getItemMainSize(key) + mainGap;
  }

  let firstInGroupIndex = firstInActiveGroupIndex;
  let groupIndex = currentGroupIndex;
  let emptyIndex = activeItemIndex;

  const doesNotFitInGroup = (key: string) =>
    totalGroupSize + getItemMainSize(key) > groupSizeLimit;

  const includeItem = (key: string) => {
    const itemMainSize = getItemMainSize(key);
    if (doesNotFitInGroup(key)) {
      groupIndex++;
      totalGroupSize = 0;
      firstInGroupIndex = keyToIndex[key]!;
    }
    totalGroupSize += itemMainSize + mainGap;
  };

  for (let i = activeItemIndex + 1; i < indexToKey.length; i++) {
    const key = indexToKey[i]!;

    if (fixedKeys?.[key]) {
      continue;
    }

    // Fill the empty slot with the current item and add all fixed
    // position items that were before this item
    includeItem(key);
    for (let j = emptyIndex + 1; j < i; j++) {
      includeItem(indexToKey[j]!);
    }
    emptyIndex = i;

    if (doesNotFitInGroup(activeItemKey)) {
      const nextItemKey = indexToKey[i + 1];
      if (nextItemKey === undefined || doesNotFitInGroup(nextItemKey)) {
        return {
          groupIndex: groupIndex + 1,
          itemIndex: i,
          itemIndexInGroup: 0
        };
      }
    } else if (groupIndex > currentGroupIndex) {
      return {
        groupIndex,
        itemIndex: i,
        itemIndexInGroup: i - firstInGroupIndex
      };
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

  const indexToKey = reorderInsert(
    props.indexToKey,
    props.activeItemIndex,
    indexes.itemIndex,
    props.fixedKeys
  );

  const keyToIndex = Object.fromEntries(
    indexToKey.map((key, index) => [key, index])
  );

  return { ...indexes, indexToKey, keyToIndex };
};

export const getSwappedToGroupAfterIndices = (
  props: ItemGroupSwapProps
): ItemGroupSwapResult | null => {
  'worklet';
  const indexes = getIndexesWhenSwappedToGroupAfter(props);
  if (indexes === null) return null;

  const indexToKey = reorderInsert(
    props.indexToKey,
    props.activeItemIndex,
    indexes.itemIndex,
    props.fixedKeys
  );

  const keyToIndex = Object.fromEntries(
    indexToKey.map((key, index) => [key, index])
  );

  return { ...indexes, indexToKey, keyToIndex };
};
