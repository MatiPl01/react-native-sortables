import { useCallback } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import {
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue
} from 'react-native-reanimated';

import { EMPTY_ARRAY } from '../../../../constants';
import type {
  Coordinate,
  Dimension,
  FlexLayout,
  SortableFlexStrategyFactory,
  Vector
} from '../../../../types';
import { reorderInsert } from '../../../../utils';
import { useDebugBoundingBox } from '../../../shared';
import {
  type ActiveIndexWhenInGroupOptions,
  getActiveIndexWhenInGroup
} from '../utils';

const MIN_ADDITIONAL_OFFSET = 5;

const useInsertStrategy: SortableFlexStrategyFactory = ({
  activeItemKey,
  calculateFlexLayout,
  columnGap,
  crossAxisGroupOffsets,
  crossAxisGroupSizes,
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
  let mainCoordinate: Coordinate = 'x';
  let crossCoordinate: Coordinate = 'y';
  let mainDimension: Dimension = 'width';
  let mainGap: SharedValue<number> = columnGap;
  let crossGap: SharedValue<number> = rowGap;

  if (flexDirection.startsWith('column')) {
    mainCoordinate = 'y';
    crossCoordinate = 'x';
    mainDimension = 'height';
    mainGap = rowGap;
    crossGap = columnGap;
  }

  const swappedBeforeIndexToKey = useSharedValue<Array<string>>(EMPTY_ARRAY);
  const swappedAfterIndexToKey = useSharedValue<Array<string>>(EMPTY_ARRAY);
  const swappedBeforeLayout = useSharedValue<FlexLayout | null>(null);
  const swappedAfterLayout = useSharedValue<FlexLayout | null>(null);
  const debugBox = useDebugBoundingBox();

  const activeGroupIndex = useDerivedValue(() => {
    const key = activeItemKey.value;
    if (key === null) return null;
    return keyToGroup.value[key] ?? null;
  });

  const getIndexToKeyWithActiveInGroup = useCallback(
    (groupIndex: null | number, options: ActiveIndexWhenInGroupOptions) => {
      'worklet';
      if (groupIndex === null || options.activeItemKey === null) {
        return EMPTY_ARRAY;
      }

      const newActiveIndex = getActiveIndexWhenInGroup(groupIndex, options);
      if (newActiveIndex === null) return EMPTY_ARRAY;

      const activeIndex = options.keyToIndex[options.activeItemKey];
      if (activeIndex === undefined) return EMPTY_ARRAY;

      return reorderInsert(options.indexToKey, activeIndex, newActiveIndex);
    },
    []
  );

  useAnimatedReaction(
    () => ({
      groupIndex: activeGroupIndex.value,
      options: {
        activeItemKey: activeItemKey.value,
        indexToKey: indexToKey.value,
        itemGroups: itemGroups.value,
        keyToGroup: keyToGroup.value,
        keyToIndex: keyToIndex.value
      }
    }),
    ({ groupIndex, options }) => {
      swappedBeforeIndexToKey.value = getIndexToKeyWithActiveInGroup(
        groupIndex === null || groupIndex === 0 ? null : groupIndex - 1,
        options
      );
    }
  );

  useAnimatedReaction(
    () => ({
      groupIndex: activeGroupIndex.value,
      options: {
        activeItemKey: activeItemKey.value,
        groupSizeLimit: groupSizeLimit.value,
        indexToKey: indexToKey.value,
        itemDimensions: itemDimensions.value,
        itemGroups: itemGroups.value,
        keyToGroup: keyToGroup.value,
        keyToIndex: keyToIndex.value,
        mainDimension,
        mainGap: mainGap.value
      }
    }),
    ({ groupIndex, options }) => {
      swappedAfterIndexToKey.value = getIndexToKeyWithActiveInGroup(
        groupIndex === null || groupIndex >= options.itemGroups.length - 1
          ? null
          : groupIndex + 1,
        options
      );
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

    const idxToKeyOptions = {
      activeItemKey: activeItemKey.value,
      groupSizeLimit: groupSizeLimit.value,
      indexToKey: indexToKey.value,
      itemDimensions: itemDimensions.value,
      itemGroups: itemGroups.value,
      keyToGroup: keyToGroup.value,
      keyToIndex: keyToIndex.value,
      mainDimension,
      mainGap: mainGap.value
    };

    // CROSS AXIS BOUNDS
    let groupIndex = activeGroupIndex.value;
    const crossAxisPosition = position[crossCoordinate];

    // Group before
    let swapGroupBeforeOffset = -Infinity;
    let swapGroupBeforeBound = Infinity;
    let firstGroupItemIndex = activeIndex;

    do {
      if (swapGroupBeforeBound !== Infinity) {
        groupIndex--;
        const newIndex = getActiveIndexWhenInGroup(groupIndex, idxToKeyOptions);
        if (newIndex === null) return;
        swappedBeforeLayout.value = calculateFlexLayout(
          reorderInsert(indexToKey.value, activeIndex, newIndex)
        );
        firstGroupItemIndex = newIndex;
      }
      swapGroupBeforeOffset =
        ((swappedBeforeLayout.value?.crossAxisGroupOffsets[groupIndex] ?? 0) +
          (crossAxisGroupOffsets.value[groupIndex] ?? 0)) /
        2;
      const additionalSwapOffset = Math.min(
        crossGap.value / 2 + MIN_ADDITIONAL_OFFSET,
        (crossGap.value +
          (swappedBeforeLayout.value?.crossAxisGroupSizes?.[groupIndex - 1] ??
            0)) /
          2
      );
      swapGroupBeforeBound = swapGroupBeforeOffset - additionalSwapOffset;
    } while (
      swapGroupBeforeBound > 0 &&
      crossAxisPosition < swapGroupBeforeBound
    );

    // Group after
    let swapGroupAfterOffset = Infinity;
    let swapGroupAfterBound = -Infinity;

    do {
      if (swapGroupAfterBound !== -Infinity) {
        groupIndex++;
        const newIndex = getActiveIndexWhenInGroup(groupIndex, idxToKeyOptions);
        if (newIndex === null) return;
        swappedAfterLayout.value = calculateFlexLayout(
          reorderInsert(indexToKey.value, activeIndex, newIndex)
        );
        firstGroupItemIndex = newIndex;
      }
      const swappedAfterOffset =
        (swappedAfterLayout.value?.crossAxisGroupOffsets[groupIndex] ?? 0) +
        (swappedAfterLayout.value?.crossAxisGroupSizes[groupIndex] ?? 0);
      const afterOffset =
        (crossAxisGroupOffsets.value[groupIndex] ?? 0) +
        (crossAxisGroupSizes.value[groupIndex] ?? 0);
      swapGroupAfterOffset =
        swappedAfterOffset === 0
          ? afterOffset
          : (swappedAfterOffset + afterOffset) / 2;
      const additionalSwapOffset = Math.min(
        crossGap.value / 2 + MIN_ADDITIONAL_OFFSET,
        (crossGap.value +
          (swappedAfterLayout.value?.crossAxisGroupSizes?.[groupIndex] ?? 0)) /
          2
      );
      swapGroupAfterBound = swapGroupAfterOffset + additionalSwapOffset;
    } while (
      crossAxisPosition > swapGroupAfterBound &&
      groupIndex < itemGroups.value.length - 1
    );

    console.log(activeGroupIndex.value, groupIndex);

    // MAIN AXIS BOUNDS
    const groupIndexDiff = groupIndex - activeGroupIndex.value;
    let groupItems: Array<string> | undefined;
    let positions: Record<string, Vector> | undefined;
    let inGroupIndex = 0;

    if (groupIndexDiff < 0) {
      // Swapped to the group before the current group
      const layout = swappedBeforeLayout.value;
      console.log('swap before', layout?.itemGroups, groupIndex);
      groupItems = layout?.itemGroups[groupIndex];
      positions = layout?.itemPositions;
    } else if (groupIndexDiff > 0) {
      // Swapped to the group after the current group
      const layout = swappedAfterLayout.value;
      console.log('swap after', layout?.itemGroups, groupIndex);
      groupItems = layout?.itemGroups[groupIndex];
      positions = layout?.itemPositions;
    } else {
      // Swapped within the same group
      groupItems = itemGroups.value[groupIndex];
      positions = itemPositions.value;
      const firstItemKey = groupItems?.[0];
      if (firstItemKey === undefined) return;
      const firstItemIndex = keyToIndex.value[firstItemKey];
      if (firstItemIndex === undefined) return;
      inGroupIndex = activeIndex - firstItemIndex;
      firstGroupItemIndex = firstItemIndex;
    }

    if (!groupItems || !positions) return;
    const mainAxisPosition = position[mainCoordinate];
    const activeMainSize = dimensions[mainDimension];

    // Item after
    let currentEndOffset =
      (positions[activeKey]?.[mainCoordinate] ?? 0) + activeMainSize;
    let swapItemAfterOffset = -Infinity;
    let swapItemAfterBound = Infinity;

    do {
      if (swapItemAfterBound !== Infinity) {
        inGroupIndex++;
      }
      const nextItemKey = groupItems[inGroupIndex + 1];
      if (nextItemKey !== undefined) {
        const nextItemStartOffset =
          positions[nextItemKey]?.[mainCoordinate] ?? 0;
        const nextItemSize =
          itemDimensions.value[nextItemKey]?.[mainDimension] ?? 0;
        const nextItemEndOffset = nextItemStartOffset + nextItemSize;
        swapItemAfterOffset =
          (currentEndOffset - activeMainSize + nextItemEndOffset) / 2;
        const additionalOffset = Math.min(
          mainGap.value / 2 + MIN_ADDITIONAL_OFFSET,
          (mainGap.value + nextItemSize) / 2
        );
        swapItemAfterBound = swapItemAfterOffset + additionalOffset;
        currentEndOffset = nextItemEndOffset;
      } else {
        swapItemAfterOffset = swapItemAfterBound = currentEndOffset;
        break;
      }
    } while (mainAxisPosition > swapItemAfterBound);

    // Item before
    const currentStartOffset = positions[activeKey]?.[mainCoordinate] ?? 0;
    let swapItemBeforeOffset = Infinity;
    let swapItemBeforeBound = -Infinity;

    do {
      if (swapItemBeforeBound !== -Infinity) {
        inGroupIndex--;
      }
      const prevItemKey = groupItems[inGroupIndex - 1];
      if (prevItemKey !== undefined) {
        const prevItemStartOffset =
          positions[prevItemKey]?.[mainCoordinate] ?? 0;
        const prevItemSize =
          itemDimensions.value[prevItemKey]?.[mainDimension] ?? 0;
        swapItemBeforeOffset =
          (prevItemStartOffset + currentStartOffset + activeMainSize) / 2;
        const additionalOffset = Math.min(
          mainGap.value / 2 + MIN_ADDITIONAL_OFFSET,
          (mainGap.value + prevItemSize) / 2
        );
        swapItemBeforeBound = swapItemBeforeOffset - additionalOffset;
      } else {
        swapItemBeforeOffset = swapItemBeforeBound = currentStartOffset;
        break;
      }
    } while (mainAxisPosition < swapItemBeforeBound);

    // DEBUG ONLY
    if (debugBox) {
      debugBox.top.update(
        { x: swapItemBeforeBound, y: swapGroupBeforeBound },
        { x: swapItemAfterBound, y: swapGroupBeforeOffset }
      );
      debugBox.bottom.update(
        { x: swapItemBeforeBound, y: swapGroupAfterBound },
        { x: swapItemAfterBound, y: swapGroupAfterOffset }
      );
      debugBox.right.update(
        { x: swapItemAfterBound, y: swapGroupBeforeOffset },
        { x: swapItemAfterOffset, y: swapGroupAfterOffset }
      );
      debugBox.left.update(
        { x: swapItemBeforeBound, y: swapGroupBeforeOffset },
        { x: swapItemBeforeOffset, y: swapGroupAfterOffset }
      );
    }

    const newActiveIndex = firstGroupItemIndex + inGroupIndex;
    if (newActiveIndex === activeIndex) return;

    console.log(activeIndex, newActiveIndex, firstGroupItemIndex, inGroupIndex);

    return reorderInsert(indexToKey.value, activeIndex, newActiveIndex);
  };
};

export default useInsertStrategy;
