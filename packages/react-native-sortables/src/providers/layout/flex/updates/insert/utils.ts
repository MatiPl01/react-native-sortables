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
  activeItemIndex,
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
  let totalGroupSize = 0;
  let targetGroupIndex = currentGroupIndex;
  let targetItemIndex = firstInActiveGroupIndex;

  for (; targetItemIndex < indexToKey.length; targetItemIndex++) {
    const key = indexToKey[targetItemIndex]!;
    if (key === activeItemKey) continue;

    const itemMainSize = itemDimensions[key]?.[mainDimension] ?? 0;

    // totalGroupSize already includes gap before the new item
    if (totalGroupSize + itemMainSize > groupSizeLimit) {
      targetGroupIndex++;
      if (targetGroupIndex === currentGroupIndex + 1) {
        break;
      }
      totalGroupSize = 0;
    }
    totalGroupSize += itemMainSize + mainGap;
  }
  targetItemIndex--;

  const activeMainSize = itemDimensions[activeItemKey]?.[mainDimension] ?? 0;

  if (totalGroupSize + activeMainSize <= groupSizeLimit) {
    // If the active item fits at the end of the current group after
    // being swapped to the group after the active one
    const firstGroupAfterItemMainSize =
      itemDimensions[indexToKey[targetItemIndex + 1]!]?.[mainDimension] ?? 0;
    if (
      targetItemIndex + 2 < indexToKey.length &&
      firstGroupAfterItemMainSize + activeMainSize + mainGap <= groupSizeLimit
    ) {
      // And if it fits on the 2nd position of the group after the active one,
      // we place it on the 2nd of that group
      return {
        groupIndex: currentGroupIndex + 1,
        itemIndex: targetItemIndex + 2,
        itemIndexInGroup: 1
      };
    }

    // Otherwise, we place it on the 1st position of the 2nd group after
    // the active one
    return {
      groupIndex: currentGroupIndex + 2,
      itemIndex: targetItemIndex + 1,
      itemIndexInGroup: 0
    };
  }

  if (targetItemIndex > activeItemIndex) {
    return {
      groupIndex: currentGroupIndex + 1,
      itemIndex: targetItemIndex,
      itemIndexInGroup: 0
    };
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
      indexes.itemIndex
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
      indexes.itemIndex
    )
  };
};
