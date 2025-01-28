import type { SharedValue } from 'react-native-reanimated';
import {
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue
} from 'react-native-reanimated';

import type {
  Coordinate,
  Dimension,
  FlexLayout,
  SortableFlexStrategyFactory
} from '../../../../../types';
import { reorderInsert } from '../../../../../utils';
import {
  getAdditionalSwapOffset,
  useDebugBoundingBox
} from '../../../../shared';
import type { ItemGroupSwapProps } from './utils';
import {
  getSwappedToGroupAfterIndices,
  getSwappedToGroupBeforeIndices,
  getTotalGroupSize
} from './utils';

const useInsertStrategy: SortableFlexStrategyFactory = ({
  activeItemKey,
  appliedLayout,
  calculateFlexLayout,
  columnGap,
  flexDirection,
  indexToKey,
  itemDimensions,
  keyToGroup,
  keyToIndex,
  rowGap,
  useFlexLayoutReaction
}) => {
  const isColumn = flexDirection.startsWith('column');
  const isReverse = flexDirection.endsWith('reverse');

  let mainCoordinate: Coordinate = 'x';
  let crossCoordinate: Coordinate = 'y';
  let mainDimension: Dimension = 'width';
  let mainGap: SharedValue<number> = columnGap;
  let crossGap: SharedValue<number> = rowGap;

  if (isColumn) {
    mainCoordinate = 'y';
    crossCoordinate = 'x';
    mainDimension = 'height';
    mainGap = rowGap;
    crossGap = columnGap;
  }

  const swappedBeforeIndexToKey = useSharedValue<Array<string> | null>(null);
  const swappedAfterIndexToKey = useSharedValue<Array<string> | null>(null);
  const swappedBeforeLayout = useSharedValue<FlexLayout | null>(null);
  const swappedAfterLayout = useSharedValue<FlexLayout | null>(null);
  const debugBox = useDebugBoundingBox();

  const activeGroupIndex = useDerivedValue(() => {
    const key = activeItemKey.value;
    if (key === null) return null;
    return keyToGroup.value[key] ?? null;
  });

  useAnimatedReaction(
    () =>
      activeItemKey.value !== null &&
      activeGroupIndex.value !== null &&
      appliedLayout.value !== null
        ? {
            activeItemIndex: keyToIndex.value[activeItemKey.value]!,
            activeItemKey: activeItemKey.value,
            currentGroupIndex: activeGroupIndex.value,
            groupSizeLimit: appliedLayout.value.groupSizeLimit,
            indexToKey: indexToKey.value,
            itemDimensions: itemDimensions.value,
            itemGroups: appliedLayout.value.itemGroups,
            keyToGroup: keyToGroup.value,
            keyToIndex: keyToIndex.value,
            mainDimension,
            mainGap: mainGap.value
          }
        : null,
    props => {
      swappedBeforeIndexToKey.value =
        (props && getSwappedToGroupBeforeIndices(props)?.indexToKey) ?? null;
      swappedAfterIndexToKey.value =
        (props && getSwappedToGroupAfterIndices(props)?.indexToKey) ?? null;
    }
  );

  useFlexLayoutReaction(swappedBeforeIndexToKey, layout => {
    'worklet';
    swappedBeforeLayout.value = layout;
  });
  useFlexLayoutReaction(swappedAfterIndexToKey, layout => {
    'worklet';
    swappedAfterLayout.value = layout;
  });

  return ({
    activeIndex,
    activeKey,
    dimensions: activeItemDimensions,
    position
  }) => {
    'worklet';
    if (activeGroupIndex.value === null || appliedLayout.value === null) return;

    let currentLayout = appliedLayout.value;
    let nextLayout: FlexLayout | null = null;

    const sharedSwapProps: Omit<
      ItemGroupSwapProps,
      'activeItemIndex' | 'currentGroupIndex'
    > = {
      activeItemKey: activeKey,
      groupSizeLimit: currentLayout.groupSizeLimit,
      indexToKey: indexToKey.value,
      itemDimensions: itemDimensions.value,
      itemGroups: currentLayout.itemGroups,
      keyToGroup: keyToGroup.value,
      keyToIndex: keyToIndex.value,
      mainDimension,
      mainGap: mainGap.value
    };

    // CROSS AXIS BOUNDS
    let groupIndex = activeGroupIndex.value;
    let firstGroupItemIndex = activeIndex;
    let itemIndexInGroup = 0;
    const crossAxisPosition = position[crossCoordinate];

    // Group before
    let swapGroupBeforeOffset = Infinity;
    let swapGroupBeforeBound = Infinity;

    do {
      if (swapGroupBeforeBound !== Infinity) {
        if (nextLayout) currentLayout = nextLayout;
        const indexes = getSwappedToGroupBeforeIndices({
          ...sharedSwapProps,
          activeItemIndex: activeIndex,
          currentGroupIndex: groupIndex
        });
        if (!indexes) break;
        nextLayout = calculateFlexLayout(indexes.indexToKey);
        groupIndex = indexes.groupIndex;
        firstGroupItemIndex = indexes.itemIndex;
        itemIndexInGroup = indexes.itemIndexInGroup;
      } else {
        nextLayout = swappedBeforeLayout.value;
      }

      swapGroupBeforeOffset =
        currentLayout.crossAxisGroupOffsets[groupIndex] ?? 0;
      const averageOffsetBefore =
        ((nextLayout?.crossAxisGroupOffsets[groupIndex] ?? 0) +
          swapGroupBeforeOffset) /
        2;
      const additionalSwapOffset = getAdditionalSwapOffset(
        crossGap.value,
        nextLayout?.crossAxisGroupSizes?.[groupIndex - 1] ?? 0
      );
      swapGroupBeforeBound = averageOffsetBefore - additionalSwapOffset;
    } while (
      swapGroupBeforeBound > 0 &&
      crossAxisPosition < swapGroupBeforeBound
    );

    // Group after
    let swappedAfteGroupsCount =
      swappedAfterLayout.value?.itemGroups.length ?? 0;
    let swapGroupAfterOffset = -Infinity;
    let swapGroupAfterBound = -Infinity;

    do {
      if (swapGroupAfterBound !== -Infinity) {
        if (nextLayout) currentLayout = nextLayout;
        const indexes = getSwappedToGroupAfterIndices({
          ...sharedSwapProps,
          activeItemIndex: activeIndex,
          currentGroupIndex: groupIndex
        });
        if (indexes === null) break;
        if (nextLayout) currentLayout = nextLayout;
        swappedAfterLayout.value = calculateFlexLayout(indexes.indexToKey);
        swappedAfteGroupsCount =
          swappedAfterLayout.value?.itemGroups.length ?? 0;
        groupIndex = indexes.groupIndex;
        firstGroupItemIndex = indexes.itemIndex;
        itemIndexInGroup = indexes.itemIndexInGroup;
      } else {
        nextLayout = swappedAfterLayout.value;
      }

      swapGroupAfterOffset =
        (currentLayout.crossAxisGroupOffsets[groupIndex] ?? 0) +
        (currentLayout.crossAxisGroupSizes[groupIndex] ?? 0);
      const swappedAfterOffset =
        (nextLayout?.crossAxisGroupOffsets[groupIndex] ?? 0) +
        (nextLayout?.crossAxisGroupSizes[groupIndex] ?? 0);
      const averageOffsetAfter =
        swappedAfterOffset === 0
          ? swapGroupAfterOffset
          : (swappedAfterOffset + swapGroupAfterOffset) / 2;
      const additionalSwapOffset = getAdditionalSwapOffset(
        crossGap.value,
        nextLayout?.crossAxisGroupSizes?.[groupIndex] ?? 0
      );
      swapGroupAfterBound = averageOffsetAfter + additionalSwapOffset;
    } while (
      crossAxisPosition > swapGroupAfterBound &&
      groupIndex < swappedAfteGroupsCount &&
      groupIndex >= activeGroupIndex.value
    );

    // MAIN AXIS BOUNDS
    // currentGroup is the updated group after new layout calculation
    // that contains the active item
    const currentGroup = currentLayout.itemGroups[groupIndex];
    if (!currentGroup) return;
    const mainAxisPosition = position[mainCoordinate];

    // Find the itemIndexInGroup of the active item if it is in the same group
    if (groupIndex === activeGroupIndex.value) {
      const firstItemKey = currentGroup[0];
      if (firstItemKey === undefined) return;
      const firstItemIndex = keyToIndex.value[firstItemKey];
      if (firstItemIndex === undefined) return;
      itemIndexInGroup = activeIndex - firstItemIndex;
    }

    const initialItemIndexInGroup = itemIndexInGroup;

    // Item after
    let swapItemAfterOffset = -Infinity;
    let swapItemAfterBound = -Infinity;

    do {
      if (swapItemAfterBound !== -Infinity) {
        itemIndexInGroup++;
      }

      const currentItemKey = currentGroup[itemIndexInGroup]!;
      const currentItemPosition = currentLayout.itemPositions[currentItemKey];
      const currentItemDimensions = itemDimensions.value[currentItemKey];
      if (!currentItemPosition || !currentItemDimensions) return;

      swapItemAfterOffset =
        currentItemPosition[mainCoordinate] +
        currentItemDimensions[mainDimension];

      const nextItemKey = currentGroup[itemIndexInGroup + 1];
      if (nextItemKey === undefined) {
        swapItemAfterBound = swapItemAfterOffset;
        break;
      }

      const nextItemPosition = currentLayout.itemPositions[nextItemKey];
      const nextItemDimensions = itemDimensions.value[nextItemKey];
      if (!nextItemPosition || !nextItemDimensions) return;

      const currentItemMainAxisPosition = currentItemPosition[mainCoordinate];
      const nextItemMainAxisPosition = nextItemPosition[mainCoordinate];

      const isCurrentBeforeNext =
        currentItemMainAxisPosition < nextItemMainAxisPosition;
      const sizeToAdd = isCurrentBeforeNext
        ? nextItemDimensions[mainDimension]
        : currentItemDimensions[mainDimension];

      const averageOffset =
        (currentItemMainAxisPosition + nextItemMainAxisPosition + sizeToAdd) /
        2;
      const additionalSwapOffset = getAdditionalSwapOffset(
        mainGap.value,
        sizeToAdd
      );
      swapItemAfterBound =
        averageOffset + (isCurrentBeforeNext ? 1 : -1) * additionalSwapOffset;
    } while (
      itemIndexInGroup < currentGroup.length - 1 && isReverse
        ? mainAxisPosition < swapItemAfterBound
        : mainAxisPosition > swapItemAfterBound
    );

    // Item before
    let canBeFirst = true;
    const groupBefore = currentLayout.itemGroups[groupIndex - 1];
    if (groupBefore && itemIndexInGroup > 0) {
      const groupBeforeSize = getTotalGroupSize(
        groupBefore,
        itemDimensions.value,
        mainDimension,
        mainGap.value
      );
      canBeFirst =
        groupBeforeSize + activeItemDimensions[mainDimension] + mainGap.value >
        currentLayout.groupSizeLimit;
    }

    let swapItemBeforeOffset = Infinity;
    let swapItemBeforeBound = Infinity;

    do {
      if (swapItemBeforeBound !== Infinity) {
        itemIndexInGroup--;
      }

      const currentItemKey = currentGroup[itemIndexInGroup]!;
      const currentItemPosition = currentLayout.itemPositions[currentItemKey];
      const currentItemDimensions = itemDimensions.value[currentItemKey];
      if (!currentItemPosition || !currentItemDimensions) return;

      swapItemBeforeOffset = currentItemPosition[mainCoordinate];

      const prevItemKey = currentGroup[itemIndexInGroup - 1];
      if (prevItemKey === undefined) {
        swapItemBeforeBound = swapItemBeforeOffset;
        break;
      }

      const prevItemPosition = currentLayout.itemPositions[prevItemKey];
      const prevItemDimensions = itemDimensions.value[prevItemKey];
      if (!prevItemPosition || !prevItemDimensions) return;

      const currentItemMainAxisPosition = currentItemPosition[mainCoordinate];
      const prevItemMainAxisPosition = prevItemPosition[mainCoordinate];

      const isPrevBeforeCurrent =
        prevItemMainAxisPosition < currentItemMainAxisPosition;
      const sizeToAdd = isPrevBeforeCurrent
        ? currentItemDimensions[mainDimension]
        : prevItemDimensions[mainDimension];

      const averageOffset =
        (prevItemMainAxisPosition + currentItemMainAxisPosition + sizeToAdd) /
        2;
      const additionalSwapOffset = getAdditionalSwapOffset(
        mainGap.value,
        sizeToAdd
      );
      swapItemBeforeBound =
        averageOffset - (isPrevBeforeCurrent ? 1 : -1) * additionalSwapOffset;
    } while (
      // handle edge case when the active item cannot be the first item of
      // the current group
      itemIndexInGroup > (canBeFirst ? 0 : 1) && isReverse
        ? mainAxisPosition > swapItemBeforeBound
        : mainAxisPosition < swapItemBeforeBound
    );

    // DEBUG ONLY
    if (debugBox) {
      console.log({
        swapGroupAfterBound,
        swapGroupAfterOffset,
        swapGroupBeforeBound,
        swapGroupBeforeOffset,
        swapItemAfterBound,
        swapItemAfterOffset,
        swapItemBeforeBound,
        swapItemBeforeOffset
      });

      if (swapGroupAfterOffset > swapGroupAfterBound) {
        swapGroupAfterOffset = swapGroupAfterBound;
      }
      if (swapGroupBeforeOffset < swapGroupBeforeBound) {
        swapGroupBeforeOffset = swapGroupBeforeBound;
      }
      if (swapItemAfterOffset > swapItemAfterBound) {
        swapItemAfterOffset = swapItemAfterBound;
      }
      if (swapItemBeforeOffset < swapItemBeforeBound) {
        swapItemBeforeOffset = swapItemBeforeBound;
      }

      if (isColumn) {
        debugBox.top.update(
          { x: swapGroupBeforeBound, y: swapItemBeforeBound },
          { x: swapGroupAfterBound, y: swapItemBeforeOffset }
        );
        debugBox.bottom.update(
          { x: swapGroupAfterBound, y: swapItemAfterOffset },
          { x: swapGroupBeforeBound, y: swapItemAfterBound }
        );
        debugBox.right.update(
          { x: swapGroupAfterOffset, y: swapItemBeforeBound },
          { x: swapGroupAfterBound, y: swapItemAfterBound }
        );
        debugBox.left.update(
          { x: swapGroupBeforeBound, y: swapItemBeforeBound },
          { x: swapGroupBeforeOffset, y: swapItemAfterBound }
        );
      } else {
        debugBox.top.update(
          { x: swapItemBeforeBound, y: swapGroupBeforeBound },
          { x: swapItemAfterBound, y: swapGroupBeforeOffset }
        );
        debugBox.bottom.update(
          { x: swapItemBeforeBound, y: swapGroupAfterBound },
          { x: swapItemAfterBound, y: swapGroupAfterOffset }
        );
        debugBox.right.update(
          { x: swapItemAfterBound, y: swapGroupBeforeBound },
          { x: swapItemAfterOffset, y: swapGroupAfterBound }
        );
        debugBox.left.update(
          { x: swapItemBeforeBound, y: swapGroupBeforeBound },
          { x: swapItemBeforeOffset, y: swapGroupAfterBound }
        );
      }
    }

    const newActiveIndex =
      firstGroupItemIndex + (itemIndexInGroup - initialItemIndexInGroup);

    if (newActiveIndex === activeIndex) return;

    return reorderInsert(indexToKey.value, activeIndex, newActiveIndex);
  };
};

export default useInsertStrategy;
