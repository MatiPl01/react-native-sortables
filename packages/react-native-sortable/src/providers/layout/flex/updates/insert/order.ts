import type { Dimension, Dimensions } from '../../../../../types';
import { reorderInsert } from '../../../../../utils';

// export type ActiveIndexWhenInGroupOptions = {
//   activeItemKey: null | string;
//   groupSizeLimit?: number;
//   indexToKey: Array<string>;
//   itemDimensions?: Record<string, Dimensions>;
//   itemGroups: Array<Array<string>>;
//   keyToGroup: Record<string, number>;
//   keyToIndex: Record<string, number>;
//   mainDimension?: Dimension;
//   mainGap?: number;
// };

// export const getActiveIndexWhenInGroup = (
//   targetGroupIndex: number,
//   {
//     activeItemKey,
//     groupSizeLimit = Infinity,
//     indexToKey,
//     itemDimensions = {},
//     itemGroups,
//     keyToGroup,
//     keyToIndex,
//     mainDimension = 'width',
//     mainGap = 0
//   }: ActiveIndexWhenInGroupOptions
// ) => {
//   'worklet';
//   if (activeItemKey === null) return null;

//   const activeIndex = keyToIndex[activeItemKey];
//   if (activeIndex === undefined) return null;

//   const currentGroupIndex = keyToGroup[activeItemKey];
//   if (currentGroupIndex === undefined) return null;

//   // If the target group is not after the current group, we can just
//   // insert the active item as the first item in the target group
//   if (targetGroupIndex <= currentGroupIndex) {
//     const firstKey = itemGroups[targetGroupIndex]?.[0];
//     if (firstKey === undefined) return null;

//     const firstIndex = keyToIndex[firstKey];
//     if (firstIndex === undefined) return null;

//     return firstIndex;
//   }

//   // Otherwise, we need to remove the active item from the current group,
//   // fit all items in the remaining space between the current group and
//   // the target group, and then insert the active item in the target group
//   if (groupSizeLimit === Infinity) {
//     return indexToKey.length - 1;
//   }

//   const firstItemKey = itemGroups[currentGroupIndex]?.[0];
//   if (firstItemKey === undefined) return null;

//   const firstItemIndex = keyToIndex[firstItemKey];
//   if (firstItemIndex === undefined) return null;

//   let totalGroupSize = 0;
//   let newGroupIndex = currentGroupIndex;
//   let targetItemIndex = firstItemIndex;

//   for (; targetItemIndex < indexToKey.length; targetItemIndex++) {
//     const key = indexToKey[targetItemIndex];
//     if (key === undefined) return null;
//     if (key === activeItemKey) continue;

//     const mainItemSize = itemDimensions[key]?.[mainDimension] ?? 0;

//     if (totalGroupSize + mainItemSize > groupSizeLimit) {
//       newGroupIndex++;
//       totalGroupSize = 0;
//     }

//     totalGroupSize += mainItemSize + mainGap;

//     if (newGroupIndex === targetGroupIndex) {
//       break;
//     }
//   }

//   return targetItemIndex - 1;
// };

export type ItemGroupSwapProps = {
  itemKey: string;
  itemIndex: number;
  groupIndex: number;
  groupSizeLimit: number;
  indexToKey: Array<string>;
  itemDimensions: Record<string, Dimensions>;
  keyToIndex: Record<string, number>;
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

const getTotalGroupSize = (
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
  itemKey,
  itemIndex,
  groupIndex,
  keyToIndex,
  itemGroups,
  groupSizeLimit,
  itemDimensions,
  mainDimension,
  mainGap
}: ItemGroupSwapProps): Omit<ItemGroupSwapResult, 'indexToKey'> | null => {
  'worklet';
  const currentGroup = itemGroups[groupIndex]!;
  const groupBefore = itemGroups[groupIndex - 1];

  if (!groupBefore) return null;

  const groupBeforeBefore = itemGroups[groupIndex - 2];
  const firstIndexInGroup = getFirstItemIndex(groupBefore, keyToIndex);
  if (firstIndexInGroup === null) return null;

  const firstInGroupBeforeResult = {
    groupIndex: groupIndex - 1,
    itemIndex: firstIndexInGroup,
    itemIndexInGroup: 0
  };

  if (!groupBeforeBefore) return firstInGroupBeforeResult;

  // If there is a group (groupBeforeBefore) before the currently checked group,
  // the swapped item may fit as the last element of this group. This is an
  // unwanted behavior, and, in this case, we need to position the swapped item
  // as the second element of the currently checked group.
  const groupBeforeBeforeSize = getTotalGroupSize(
    groupBeforeBefore,
    itemDimensions,
    mainDimension,
    mainGap
  );
  const itemMainSize = itemDimensions[itemKey]?.[mainDimension] ?? 0;

  // If it doesn't fit, we can't put the swapped item as the first element
  if (groupBeforeBeforeSize + itemMainSize + mainGap > groupSizeLimit) {
    return firstInGroupBeforeResult;
  }

  // Otherwise, we put the swapped item as the second element of the currently
  // checked group (only if it can fit in this group). If it doesn't fit,
  // we put it as the first element, even though it will be automatically
  // fit in the group before.
  if (firstIndexInGroup + 1 < itemIndex) {
    return {
      groupIndex: groupIndex - 1,
      itemIndex: firstIndexInGroup + 1,
      itemIndexInGroup: 1
    };
  }

  return firstInGroupBeforeResult;
};

const getIndexesWhenSwappedToGroupAfter = (
  props: ItemGroupSwapProps
): Omit<ItemGroupSwapResult, 'indexToKey'> | null => {
  'worklet';
  // Otherwise, we need to remove the current item from the current group,
  // fit all items in the remaining space between the current group and
  // the target group, and then insert the current item in the target group
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
      props.itemIndex,
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

  return null;

  return {
    ...indexes,
    indexToKey: reorderInsert(
      props.indexToKey,
      indexes.itemIndex,
      props.itemIndex
    )
  };
};
