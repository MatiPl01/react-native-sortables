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
};

export type ItemGroupSwapResult = {
  indexToKey: Array<string>;
  itemIndex: number;
  itemIndexInGroup: number;
  groupIndex: number;
};

const getFirstItemIndex = (
  group: Array<string>,
  keyToIndex: Record<string, number>
) => {
  'worklet';
  const firstKey = group[0];
  if (firstKey === undefined) return null;
  return keyToIndex[firstKey] ?? null;
};

const getLastItemIndex = (
  group: Array<string>,
  keyToIndex: Record<string, number>
) => {
  'worklet';
  const lastKey = group[group.length - 1];
  if (lastKey === undefined) return null;
  return keyToIndex[lastKey] ?? null;
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
  groupSizeLimit,
  itemDimensions,
  itemGroups,
  keyToIndex,
  mainDimension,
  mainGap
}: ItemGroupSwapProps): Omit<ItemGroupSwapResult, 'indexToKey'> | null => {
  'worklet';
  if (groupSizeLimit === Infinity || currentGroupIndex < 1) {
    return null;
  }

  const firstInGroupBeforeIndex = getFirstItemIndex(
    itemGroups[currentGroupIndex - 1]!,
    keyToIndex
  );
  const lastInGroupBeforeIndex = getLastItemIndex(
    itemGroups[currentGroupIndex - 1]!,
    keyToIndex
  );
  if (firstInGroupBeforeIndex === null || lastInGroupBeforeIndex === null) {
    return null;
  }

  const activeMainSize = itemDimensions[activeItemKey]?.[mainDimension] ?? 0;

  if (currentGroupIndex > 1) {
    // If there is a group before the group before the active group,
    // we have to check whether the active item won't wrap to this group
    const totalGroupBeforeBeforeSize = getTotalGroupSize(
      itemGroups[currentGroupIndex - 2]!,
      itemDimensions,
      mainDimension,
      mainGap
    );

    if (totalGroupBeforeBeforeSize + activeMainSize <= groupSizeLimit) {
      if (firstInGroupBeforeIndex < lastInGroupBeforeIndex) {
        // If the active item fits in the group before the group before
        // the active group, we want to put it in the second position of
        // the group before the active group to prevent it from wrapping
        // to the group before it (we cannot put it as the first one as
        // it will be wrapped in this case).
        return {
          groupIndex: currentGroupIndex - 1,
          itemIndex: firstInGroupBeforeIndex + 1,
          itemIndexInGroup: 1
        };
      }

      // If the active item fits in the group before the group before,
      // and it doesn't fit in the group before the active group,
      // we want to put it in the 2nd group before the active group.
      return {
        groupIndex: currentGroupIndex - 2,
        itemIndex:
          getFirstItemIndex(
            itemGroups[currentGroupIndex - 2] ?? [],
            keyToIndex
          ) ?? 0,
        itemIndexInGroup: 0
      };
    }
  }

  return {
    groupIndex: currentGroupIndex - 1,
    itemIndex: firstInGroupBeforeIndex,
    itemIndexInGroup: 0
  };
};

const getIndexesWhenSwappedToGroupAfter = ({
  activeItemKey,
  currentGroupIndex,
  groupSizeLimit,
  indexToKey,
  itemDimensions,
  itemGroups,
  keyToIndex,
  mainDimension,
  mainGap
}: ItemGroupSwapProps): Omit<ItemGroupSwapResult, 'indexToKey'> | null => {
  'worklet';
  if (
    groupSizeLimit === Infinity ||
    currentGroupIndex + 1 >= itemGroups.length
  ) {
    return null;
  }

  const firstInActiveGroupIndex = getFirstItemIndex(
    itemGroups[currentGroupIndex]!,
    keyToIndex
  );
  const lastInActiveGroupIndex = getLastItemIndex(
    itemGroups[currentGroupIndex]!,
    keyToIndex
  );
  if (firstInActiveGroupIndex === null || lastInActiveGroupIndex === null) {
    return null;
  }

  // We need to remove the active item from the its group, fit all items
  // in the remaining space between the active item's group and the target group,
  // and then insert the active item in the target group
  let targetItemIndex = firstInActiveGroupIndex;
  let totalGroupSize = 0;
  let nextGroupFirstItemKey: null | string = null;

  for (let i = firstInActiveGroupIndex; i < indexToKey.length; i++) {
    const key = indexToKey[i]!;
    if (key === activeItemKey) continue;

    const itemMainSize = itemDimensions[key]?.[mainDimension] ?? 0;
    if (totalGroupSize + itemMainSize > groupSizeLimit) {
      nextGroupFirstItemKey = key;
      break;
    }

    totalGroupSize += itemMainSize + mainGap;
    targetItemIndex++;
  }

  const activeMainSize = itemDimensions[activeItemKey]?.[mainDimension] ?? 0;
  if (totalGroupSize + activeMainSize > groupSizeLimit) {
    // If the active item can be the first element of the next group (it won't
    // wrap to the current group), we put it in the 1st position of the next group
    return {
      groupIndex: currentGroupIndex + 1,
      itemIndex: targetItemIndex, // is the first item of the next group
      itemIndexInGroup: 0
    };
  }

  if (
    nextGroupFirstItemKey &&
    (itemDimensions[nextGroupFirstItemKey]?.[mainDimension] ?? 0) +
      mainGap +
      activeMainSize <=
      groupSizeLimit
  ) {
    // Otherwise, if it can be the second item of the next group, we put it there
    // to prevent wrapping to the current group
    return {
      groupIndex: currentGroupIndex + 1,
      itemIndex: targetItemIndex + 1, // is the second item of the next group
      itemIndexInGroup: 1
    };
  }

  return {
    groupIndex: currentGroupIndex + 2, // is in a group after the next group
    itemIndex: targetItemIndex + 1, // is after the item from the next group
    itemIndexInGroup: 0
  };
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
      undefined // TODO - add fixed items support in flex
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
      undefined // TODO - add fixed items support in flex
    )
  };
};
