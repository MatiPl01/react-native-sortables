/* eslint-disable import/no-unused-modules */
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
  SortableFlexStrategyFactory
} from '../../../../types';
import { getIndexToKeyWithActiveInGroup } from '../utils';

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

  const activeGroupIndex = useDerivedValue(() => {
    const key = activeItemKey.value;
    if (key === null) return null;
    return keyToGroup.value[key] ?? null;
  });

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
      if (groupIndex === null || groupIndex === 0) {
        swappedBeforeIndexToKey.value = EMPTY_ARRAY;
        return;
      }
      swappedBeforeIndexToKey.value =
        getIndexToKeyWithActiveInGroup(groupIndex - 1, options) ?? EMPTY_ARRAY;
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
      if (groupIndex === null || groupIndex >= options.itemGroups.length - 1) {
        swappedAfterIndexToKey.value = EMPTY_ARRAY;
        return;
      }
      swappedAfterIndexToKey.value =
        getIndexToKeyWithActiveInGroup(groupIndex + 1, options) ?? EMPTY_ARRAY;
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

  return ({ activeIndex, position }) => {
    'worklet';
    if (activeGroupIndex.value === null) return;

    const crossOffset = position[crossCoordinate];

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

    let groupIndex = activeGroupIndex.value;

    // CROSS AXIS BOUNDS
    // Group before
    let swapBeforeOffset = -Infinity;
    let swapBeforeBound = Infinity;

    do {
      if (swapBeforeBound !== Infinity) {
        groupIndex--;
        swappedBeforeLayout.value = calculateFlexLayout(
          getIndexToKeyWithActiveInGroup(groupIndex, idxToKeyOptions) ??
            EMPTY_ARRAY
        );
      }
      swapBeforeOffset =
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
      swapBeforeBound = swapBeforeOffset - additionalSwapOffset;
    } while (swapBeforeBound > 0 && crossOffset < swapBeforeBound);

    // Group after
    let swapAfterOffset = Infinity;
    let swapAfterBound = -Infinity;

    do {
      if (swapAfterBound !== -Infinity) {
        groupIndex++;
        swappedAfterLayout.value = calculateFlexLayout(
          getIndexToKeyWithActiveInGroup(groupIndex, idxToKeyOptions) ??
            EMPTY_ARRAY
        );
      }
      const swappedAfterOffset =
        (swappedAfterLayout.value?.crossAxisGroupOffsets[groupIndex] ?? 0) +
        (swappedAfterLayout.value?.crossAxisGroupSizes[groupIndex] ?? 0);
      const afterOffset =
        (crossAxisGroupOffsets.value[groupIndex] ?? 0) +
        (crossAxisGroupSizes.value[groupIndex] ?? 0);
      swapAfterOffset =
        swappedAfterOffset === 0
          ? afterOffset
          : (swappedAfterOffset + afterOffset) / 2;
      const additionalSwapOffset = Math.min(
        crossGap.value / 2 + MIN_ADDITIONAL_OFFSET,
        (crossGap.value +
          (swappedAfterLayout.value?.crossAxisGroupSizes?.[groupIndex + 1] ??
            0)) /
          2
      );
      swapAfterBound = swapAfterOffset + additionalSwapOffset;
    } while (
      crossOffset > swapAfterBound &&
      groupIndex < itemGroups.value.length - 1
    );

    // MAIN AXIS BOUNDS
  };
};

export default useInsertStrategy;
