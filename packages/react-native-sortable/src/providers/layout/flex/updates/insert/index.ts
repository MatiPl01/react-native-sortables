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
  SortableFlexStrategyFactory,
  Vector
} from '../../../../../types';
import { reorderInsert } from '../../../../../utils';
import { useDebugBoundingBox } from '../../../../shared';
import {
  getSwappedToGroupBeforeIndices,
  getSwappedToGroupAfterIndices,
  ItemGroupSwapProps
} from './order';

const MIN_ADDITIONAL_OFFSET = 5;

const useInsertStrategy: SortableFlexStrategyFactory = ({
  activeItemKey,
  calculateFlexLayout,
  columnGap,
  crossAxisGroupOffsets,
  crossAxisGroupSizes,
  debugContext,
  flexDirection,
  groupSizeLimit,
  indexToKey,
  itemDimensions,
  itemGroups,
  itemPositions,
  keyToGroup,
  keyToIndex,
  rowGap,
  useFlexLayoutReaction
}) => {
  const isColumn = flexDirection.startsWith('column');

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

  const debugLines = debugContext?.useDebugLines([
    'beforeOffset',
    'beforeBound',
    'afterOffset',
    'afterBound'
  ]);

  const activeGroupIndex = useDerivedValue(() => {
    const key = activeItemKey.value;
    if (key === null) return null;
    return keyToGroup.value[key] ?? null;
  });

  useAnimatedReaction(
    () =>
      activeItemKey.value !== null && activeGroupIndex.value !== null
        ? {
            activeItemKey: activeItemKey.value,
            activeItemIndex: keyToIndex.value[activeItemKey.value]!,
            currentGroupIndex: activeGroupIndex.value,
            groupSizeLimit: groupSizeLimit.value,
            indexToKey: indexToKey.value,
            itemDimensions: itemDimensions.value,
            itemGroups: itemGroups.value,
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

  return ({ activeIndex, activeKey, dimensions, position }) => {
    'worklet';
    if (activeGroupIndex.value === null) return;

    const sharedSwapProps: Omit<
      ItemGroupSwapProps,
      'activeItemIndex' | 'currentGroupIndex'
    > = {
      activeItemKey: activeKey,
      groupSizeLimit: groupSizeLimit.value,
      indexToKey: indexToKey.value,
      keyToIndex: keyToIndex.value,
      keyToGroup: keyToGroup.value,
      itemDimensions: itemDimensions.value,
      itemGroups: itemGroups.value,
      mainDimension,
      mainGap: mainGap.value
    };

    // CROSS AXIS BOUNDS
    let groupIndex = activeGroupIndex.value;
    let firstGroupItemIndex = activeIndex;
    const crossAxisPosition = position[crossCoordinate];

    // Group before
    let swapGroupBeforeOffset = -Infinity;
    let swapGroupBeforeBound = Infinity;

    do {
      let currentCrossAxisGroupOffsets = crossAxisGroupOffsets.value;

      if (swapGroupBeforeBound !== Infinity) {
        const indexes = getSwappedToGroupBeforeIndices({
          ...sharedSwapProps,
          currentGroupIndex: groupIndex,
          activeItemIndex: activeIndex
        });
        if (indexes === null) break;
        if (swappedBeforeLayout.value) {
          currentCrossAxisGroupOffsets =
            swappedBeforeLayout.value?.crossAxisGroupOffsets;
        }
        swappedBeforeLayout.value = calculateFlexLayout(indexes.indexToKey);
        firstGroupItemIndex = indexes.itemIndex;
        groupIndex = indexes.groupIndex;
      }

      swapGroupBeforeOffset = currentCrossAxisGroupOffsets[groupIndex] ?? 0;
      const averageOffsetBefore =
        ((swappedBeforeLayout.value?.crossAxisGroupOffsets[groupIndex] ?? 0) +
          swapGroupBeforeOffset) /
        2;
      const additionalSwapOffset = Math.min(
        crossGap.value / 2 + MIN_ADDITIONAL_OFFSET,
        (crossGap.value +
          (swappedBeforeLayout.value?.crossAxisGroupSizes?.[groupIndex - 1] ??
            0)) /
          2
      );
      swapGroupBeforeBound = averageOffsetBefore - additionalSwapOffset;
    } while (
      swapGroupBeforeBound > 0 &&
      crossAxisPosition < swapGroupBeforeBound
    );

    // Group after
    let swappedAfteGroupsCount =
      swappedAfterLayout.value?.itemGroups.length ?? 0;
    let swapGroupAfterOffset = Infinity;
    let swapGroupAfterBound = -Infinity;

    do {
      let currentCrossAxisGroupOffsets = crossAxisGroupOffsets.value;
      let currentCrossAxisGroupSizes = crossAxisGroupSizes.value;

      if (swapGroupAfterBound !== -Infinity) {
        const indexes = getSwappedToGroupAfterIndices({
          ...sharedSwapProps,
          currentGroupIndex: groupIndex,
          activeItemIndex: activeIndex
        });
        if (indexes === null) break;
        if (swappedAfterLayout.value) {
          currentCrossAxisGroupOffsets =
            swappedAfterLayout.value?.crossAxisGroupOffsets;
          currentCrossAxisGroupSizes =
            swappedAfterLayout.value?.crossAxisGroupSizes;
        }
        swappedAfterLayout.value = calculateFlexLayout(indexes.indexToKey);
        swappedAfteGroupsCount =
          swappedAfterLayout.value?.itemGroups.length ?? 0;
        firstGroupItemIndex = indexes.itemIndex;
        groupIndex = indexes.groupIndex;
      }

      swapGroupAfterOffset =
        (currentCrossAxisGroupOffsets[groupIndex] ?? 0) +
        (currentCrossAxisGroupSizes[groupIndex] ?? 0);
      const swappedAfterOffset =
        (swappedAfterLayout.value?.crossAxisGroupOffsets[groupIndex] ?? 0) +
        (swappedAfterLayout.value?.crossAxisGroupSizes[groupIndex] ?? 0);
      const averageOffsetAfter =
        swappedAfterOffset === 0
          ? swapGroupAfterOffset
          : (swappedAfterOffset + swapGroupAfterOffset) / 2;
      const additionalSwapOffset = Math.min(
        crossGap.value / 2 + MIN_ADDITIONAL_OFFSET,
        (crossGap.value +
          (swappedAfterLayout.value?.crossAxisGroupSizes?.[groupIndex] ?? 0)) /
          2
      );
      swapGroupAfterBound = averageOffsetAfter + additionalSwapOffset;
    } while (
      crossAxisPosition > swapGroupAfterBound &&
      groupIndex < swappedAfteGroupsCount &&
      groupIndex >= activeGroupIndex.value
    );

    debugLines?.beforeBound.set({ y: swapGroupBeforeBound, color: 'blue' });
    debugLines?.beforeOffset.set({
      y: Math.max(swapGroupBeforeOffset, swapGroupBeforeBound),
      color: 'red'
    });
    debugLines?.afterOffset.set({
      y: Math.min(swapGroupAfterOffset, swapGroupAfterBound),
      color: 'purple'
    });
    debugLines?.afterBound.set({ y: swapGroupAfterBound, color: 'black' });

    // // MAIN AXIS BOUNDS
    // const groupIndexDiff = groupIndex - activeGroupIndex.value;
    // let groupItems: Array<string> | undefined;
    // let positions: Record<string, Vector> | undefined;
    // let inGroupIndex = 0;

    // if (groupIndexDiff < 0) {
    //   // Swapped to the group before the current group
    //   const layout = swappedBeforeLayout.value;
    //   groupItems = layout?.itemGroups[groupIndex];
    //   positions = layout?.itemPositions;
    // } else if (groupIndexDiff > 0) {
    //   // Swapped to the group after the current group
    //   const layout = swappedAfterLayout.value;
    //   groupItems = layout?.itemGroups[groupIndex];
    //   positions = layout?.itemPositions;
    // } else {
    //   // Swapped within the same group
    //   groupItems = itemGroups.value[groupIndex];
    //   positions = itemPositions.value;
    //   const firstItemKey = groupItems?.[0];
    //   if (firstItemKey === undefined) return;
    //   const firstItemIndex = keyToIndex.value[firstItemKey];
    //   if (firstItemIndex === undefined) return;
    //   inGroupIndex = activeIndex - firstItemIndex;
    //   firstGroupItemIndex = firstItemIndex;
    // }

    // if (!groupItems || !positions) return;
    // const mainAxisPosition = position[mainCoordinate];
    // const activeMainSize = dimensions[mainDimension];

    // // Item after
    // let currentEndOffset =
    //   (positions[activeKey]?.[mainCoordinate] ?? 0) + activeMainSize;
    // let swapItemAfterOffset = -Infinity;
    // let swapItemAfterBound = Infinity;

    // do {
    //   if (swapItemAfterBound !== Infinity) {
    //     inGroupIndex++;
    //   }
    //   const nextItemKey = groupItems[inGroupIndex + 1];
    //   if (nextItemKey !== undefined) {
    //     const nextItemStartOffset =
    //       positions[nextItemKey]?.[mainCoordinate] ?? 0;
    //     const nextItemSize =
    //       itemDimensions.value[nextItemKey]?.[mainDimension] ?? 0;
    //     const nextItemEndOffset = nextItemStartOffset + nextItemSize;
    //     swapItemAfterOffset =
    //       (currentEndOffset - activeMainSize + nextItemEndOffset) / 2;
    //     const additionalOffset = Math.min(
    //       mainGap.value / 2 + MIN_ADDITIONAL_OFFSET,
    //       (mainGap.value + nextItemSize) / 2
    //     );
    //     swapItemAfterBound = swapItemAfterOffset + additionalOffset;
    //     currentEndOffset = nextItemEndOffset;
    //   } else {
    //     swapItemAfterOffset = swapItemAfterBound = currentEndOffset;
    //     break;
    //   }
    // } while (mainAxisPosition > swapItemAfterBound);

    // // Item before
    // const currentStartOffset = positions[activeKey]?.[mainCoordinate] ?? 0;
    // let swapItemBeforeOffset = Infinity;
    // let swapItemBeforeBound = -Infinity;

    // do {
    //   if (swapItemBeforeBound !== -Infinity) {
    //     inGroupIndex--;
    //   }
    //   const prevItemKey = groupItems[inGroupIndex - 1];
    //   if (prevItemKey !== undefined) {
    //     const prevItemStartOffset =
    //       positions[prevItemKey]?.[mainCoordinate] ?? 0;
    //     const prevItemSize =
    //       itemDimensions.value[prevItemKey]?.[mainDimension] ?? 0;
    //     swapItemBeforeOffset =
    //       (prevItemStartOffset + currentStartOffset + activeMainSize) / 2;
    //     const additionalOffset = Math.min(
    //       mainGap.value / 2 + MIN_ADDITIONAL_OFFSET,
    //       (mainGap.value + prevItemSize) / 2
    //     );
    //     swapItemBeforeBound = swapItemBeforeOffset - additionalOffset;
    //   } else {
    //     swapItemBeforeOffset = swapItemBeforeBound = currentStartOffset;
    //     break;
    //   }
    // } while (mainAxisPosition < swapItemBeforeBound);

    // // DEBUG ONLY
    // if (debugBox) {
    //   if (isColumn) {
    //     debugBox.top.update(
    //       { x: swapGroupBeforeBound, y: swapItemBeforeBound },
    //       { x: swapGroupAfterBound, y: swapItemBeforeOffset }
    //     );
    //     debugBox.bottom.update(
    //       { x: swapGroupAfterBound, y: swapItemAfterOffset },
    //       { x: swapGroupBeforeBound, y: swapItemAfterBound }
    //     );
    //     debugBox.right.update(
    //       { x: swapGroupAfterOffset, y: swapItemBeforeBound },
    //       { x: swapGroupAfterBound, y: swapItemAfterBound }
    //     );
    //     debugBox.left.update(
    //       { x: swapGroupBeforeBound, y: swapItemBeforeBound },
    //       { x: swapGroupBeforeOffset, y: swapItemAfterBound }
    //     );
    //   } else {
    //     debugBox.top.update(
    //       { x: swapItemBeforeBound, y: swapGroupBeforeBound },
    //       { x: swapItemAfterBound, y: swapGroupBeforeOffset }
    //     );
    //     debugBox.bottom.update(
    //       { x: swapItemBeforeBound, y: swapGroupAfterBound },
    //       { x: swapItemAfterBound, y: swapGroupAfterOffset }
    //     );
    //     debugBox.right.update(
    //       { x: swapItemAfterBound, y: swapGroupBeforeBound },
    //       { x: swapItemAfterOffset, y: swapGroupAfterBound }
    //     );
    //     debugBox.left.update(
    //       { x: swapItemBeforeBound, y: swapGroupBeforeBound },
    //       { x: swapItemBeforeOffset, y: swapGroupAfterBound }
    //     );
    //   }
    // }

    // if (inGroupIndex === -1) return;

    // const newActiveIndex = firstGroupItemIndex + inGroupIndex;
    // if (newActiveIndex === activeIndex) return;

    // console.log(activeIndex, newActiveIndex, firstGroupItemIndex, inGroupIndex);

    // return reorderInsert(indexToKey.value, activeIndex, newActiveIndex);

    if (firstGroupItemIndex === activeIndex) return;

    console.log(
      'activeIndex >>>',
      activeIndex,
      'firstGroupItemIndex >>>',
      firstGroupItemIndex
    );

    return reorderInsert(indexToKey.value, activeIndex, firstGroupItemIndex);
  };
};

export default useInsertStrategy;
