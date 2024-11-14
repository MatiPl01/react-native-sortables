import { useCommonValuesContext, useOrderUpdater } from '../../../shared';
import { useFlexLayoutContext } from '../FlexLayoutProvider';
import { useSwapDebugRectsUpdater } from './debug';
import { useAxisParams, useItemBoundsProviders } from './helpers';

export function useFlexOrderUpdater(): void {
  const { indexToKey } = useCommonValuesContext();
  const { flexDirection, itemGroups, keyToGroup } = useFlexLayoutContext();
  const { coordinates } = useAxisParams(flexDirection);

  const updateDebugRects = useSwapDebugRectsUpdater();
  const {
    calculateGroupCrossAxisBounds,
    calculateItemInGroupMainAxisBounds,
    getGroupBoundingItems
  } = useItemBoundsProviders();

  useOrderUpdater(
    ({ activeIndex, activeKey, strategy, touchPosition }) => {
      'worklet';
      // Step 1: Find the index of the group closest to the touch position
      const currentGroupIndex = keyToGroup.value[activeKey];
      if (currentGroupIndex === undefined) {
        return;
      }
      let crossBounds = calculateGroupCrossAxisBounds(currentGroupIndex);
      if (!crossBounds) {
        return;
      }

      const updateCrossBounds = (newGroupIndex: number) => {
        const newBounds = calculateGroupCrossAxisBounds(newGroupIndex);
        if (newBounds) {
          crossBounds = newBounds;
          return true;
        }
        return false;
      };

      // Find the new item group index
      let targetGroupIndex = currentGroupIndex;
      while (
        targetGroupIndex > 0 &&
        touchPosition[coordinates.cross] < crossBounds.bounds.before
      ) {
        if (!updateCrossBounds(targetGroupIndex - 1)) {
          break;
        }
        targetGroupIndex--;
      }
      while (
        targetGroupIndex < itemGroups.value.length - 1 &&
        touchPosition[coordinates.cross] > crossBounds.bounds.after
      ) {
        if (!updateCrossBounds(targetGroupIndex + 1)) {
          break;
        }
        targetGroupIndex++;
      }

      // Step 2: Find the target item index within the group
      // (or one element before/after items in the group)
      const groupBoundingItems = getGroupBoundingItems(targetGroupIndex);
      if (!groupBoundingItems) {
        return;
      }
      const { indices: boundingIndices } = groupBoundingItems;

      // Start searching from the active item index if the group hasn't
      // changed or from the middle of the group if the group has changed
      let targetItemIndex =
        targetGroupIndex === currentGroupIndex
          ? activeIndex
          : Math.round((boundingIndices.first + boundingIndices.last) / 2);
      let mainBounds = calculateItemInGroupMainAxisBounds(
        targetItemIndex,
        targetGroupIndex
      );

      const minIndex = Math.max(0, boundingIndices.first - 1);
      while (
        targetItemIndex > minIndex &&
        mainBounds?.bounds.before &&
        touchPosition[coordinates.main] < mainBounds.bounds.before
      ) {
        mainBounds = calculateItemInGroupMainAxisBounds(
          --targetItemIndex,
          targetGroupIndex
        );
        console.log('before', mainBounds);
      }
      const maxIndex = Math.min(
        indexToKey.value.length - 1,
        boundingIndices.last + 1
      );
      while (
        targetItemIndex < maxIndex &&
        mainBounds?.bounds.after &&
        touchPosition[coordinates.main] > mainBounds.bounds.after
      ) {
        mainBounds = calculateItemInGroupMainAxisBounds(
          ++targetItemIndex,
          targetGroupIndex
        );
        console.log('after', mainBounds);
      }

      // console.log('groupIndex', currentGroupIndex, targetGroupIndex);
      // console.log('itemIndex', activeIndex, targetItemIndex);

      // const itemBounds = calculateItemBounds(activeIndex);
      // if (!itemBounds) {
      //   return;
      // }
      // let { cross, main } = itemBounds;
      // let targetIndex = activeIndex;

      // if (updateDebugRects) {
      //   updateDebugRects(coordinates, gaps, main, cross);
      // }

      // const groupIndex = keyToGroup.value[activeKey];
      // if (groupIndex === undefined) {
      //   return;
      // }
      // const groupKeys = itemGroups.value[groupIndex];
      // if (!groupKeys) {
      //   return;
      // }
      // const firstGroupItemKey = groupKeys[0];
      // const lastGroupItemKey = groupKeys[groupKeys.length - 1];
      // if (firstGroupItemKey === undefined || lastGroupItemKey === undefined) {
      //   return;
      // }
      // let targetGroupIndex = groupIndex;

      // if (targetGroupIndex !== groupIndex) {
      //   // If the group has changed, move the item to the new group and
      //   // find its position within the new group
      //   // (start from the last item in the group) // TODO - check for reverse direction
      //   const newGroup = itemGroups.value[targetGroupIndex];
      //   if (!newGroup) {
      //     return;
      //   }
      //   const lastItemKey = newGroup[newGroup.length - 1] ?? '';
      //   let indexInGroup = keyToIndex.value[lastItemKey];
      //   if (indexInGroup === undefined) {
      //     return;
      //   }

      //   for (let i = newGroup.length - 1; i >= 0; i--) {
      //     indexInGroup--;
      //   }
      // } else {
      //   const firstGroupItemIndex = keyToIndex.value[firstGroupItemKey];
      //   const lastGroupItemIndex = keyToIndex.value[lastGroupItemKey];
      //   // If the group hasn't changed, find the new item position within the
      //   // current group
      //   const updateMainBounds = (newItemIndex: number) => {
      //     const newBounds = calculateItemMainAxisBounds(newItemIndex);
      //     if (newBounds) {
      //       main = newBounds;
      //       return true;
      //     }
      //     return false;
      //   };

      //   while (
      //     firstGroupItemIndex !== undefined &&
      //     targetIndex >= firstGroupItemIndex &&
      //     main.bounds.before !== undefined &&
      //     touchPosition[coordinates.main] < main.bounds.before
      //   ) {
      //     if (!updateMainBounds(--targetIndex)) break;
      //   }
      //   while (
      //     lastGroupItemIndex !== undefined &&
      //     targetIndex <= lastGroupItemIndex &&
      //     main.bounds.after !== undefined &&
      //     touchPosition[coordinates.main] > main.bounds.after
      //   ) {
      //     if (!updateMainBounds(++targetIndex)) break;
      //   }
      // }

      // // APPLYING NEW ORDER (if needed)
      // if (targetIndex === activeIndex) {
      //   return;
      // }
      // return reorderItems(indexToKey.value, activeIndex, targetIndex, strategy);
    },
    [flexDirection]
  );
}
