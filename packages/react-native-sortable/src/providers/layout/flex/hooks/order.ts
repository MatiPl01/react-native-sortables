import { reorderItems } from '../../../../utils';
import { useCommonValuesContext, useOrderUpdater } from '../../../shared';
import { useFlexLayoutContext } from '../FlexLayoutProvider';
import { useSwapDebugRectsUpdater } from './debug';
import { useAxisParams, useItemBoundsProviders } from './helpers';

export function useFlexOrderUpdater(): void {
  const { indexToKey } = useCommonValuesContext();
  const { flexDirection, itemGroups, keyToGroup } = useFlexLayoutContext();
  const { coordinates, gaps } = useAxisParams(flexDirection);

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

      const minIndex = Math.max(0, boundingIndices.first - 1);
      const maxIndex = Math.min(
        indexToKey.value.length - 1,
        boundingIndices.last + 1
      );
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const mainBounds = calculateItemInGroupMainAxisBounds(
          targetItemIndex,
          targetGroupIndex
        );
        if (!mainBounds) {
          return;
        }
        if (
          targetItemIndex > minIndex &&
          mainBounds?.bounds.before &&
          touchPosition[coordinates.main] < mainBounds.bounds.before
        ) {
          targetItemIndex--;
        } else if (
          targetItemIndex < maxIndex &&
          mainBounds?.bounds.after &&
          touchPosition[coordinates.main] > mainBounds.bounds.after
        ) {
          targetItemIndex++;
        } else {
          // FOR DEBUGGING PURPOSES
          if (updateDebugRects) {
            updateDebugRects(coordinates, gaps, mainBounds, crossBounds);
          }
          break;
        }
      }

      // APPLYING NEW ORDER (if needed)
      if (targetItemIndex === activeIndex) {
        return;
      }
      return reorderItems(
        indexToKey.value,
        activeIndex,
        targetItemIndex,
        strategy
      );
    },
    [flexDirection]
  );
}
