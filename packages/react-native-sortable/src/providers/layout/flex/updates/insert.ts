import type { SharedValue } from 'react-native-reanimated';
import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';

import type {
  Coordinate,
  Dimension,
  SortableFlexStrategyFactory
} from '../../../../types';
import { areArraysDifferent, reorderInsert } from '../../../../utils';
import { EMPTY_ARRAY } from '../../../../constants';

export const useInsertStrategy: SortableFlexStrategyFactory = ({
  activeItemKey,
  columnGap,
  crossAxisGroupOffsets,
  flexDirection,
  groupSizeLimit,
  indexToKey,
  itemDimensions,
  itemGroups,
  itemPositions,
  keyToGroup,
  keyToIndex,
  rowGap,
  useFlexLayout
}) => {
  let mainCoordinate: Coordinate = 'x';
  let crossCoordinate: Coordinate = 'y';
  let mainDimension: Dimension = 'width';
  let mainGap: SharedValue<number> = columnGap;

  if (flexDirection.startsWith('column')) {
    mainCoordinate = 'y';
    crossCoordinate = 'x';
    mainDimension = 'height';
    mainGap = rowGap;
  }

  const indexToKeyWithActiveInGroupBefore =
    useSharedValue<Array<string>>(EMPTY_ARRAY);
  const indexToKeyWithActiveInGroupAfter =
    useSharedValue<Array<string>>(EMPTY_ARRAY);

  useAnimatedReaction(
    () => ({
      activeKey: activeItemKey.value,
      dimensions: itemDimensions.value,
      groups: itemGroups.value,
      kToGroup: keyToGroup.value,
      limit: groupSizeLimit.value
    }),
    ({ activeKey, dimensions, groups, kToGroup, limit }) => {
      if (activeKey === null) {
        indexToKeyWithActiveInGroupBefore.value = EMPTY_ARRAY;
        indexToKeyWithActiveInGroupAfter.value = EMPTY_ARRAY;
        return;
      }

      const activeIndex = keyToIndex.value[activeKey];
      if (activeIndex === undefined) {
        return;
      }
      const groupIndex = kToGroup[activeKey];
      if (groupIndex === undefined) {
        return;
      }

      const groupBefore = groups[groupIndex - 1];

      if (groupBefore) {
        const firstKey = groupBefore[0];
        if (firstKey) {
          const firstIndex = keyToIndex.value[firstKey];
          if (firstIndex !== undefined) {
            const result = reorderInsert(
              indexToKey.value,
              activeIndex,
              firstIndex
            );
            if (
              areArraysDifferent(
                result,
                indexToKeyWithActiveInGroupBefore.value
              )
            ) {
              indexToKeyWithActiveInGroupBefore.value = result;
            }
          }
        }
      }

      const group = groups[groupIndex];
      const groupAfter = groups[groupIndex + 1];
      if (group && groupAfter) {
        let totalGroupSize = group.reduce(
          (acc, key) =>
            acc +
            (key === activeKey
              ? 0
              : (dimensions[key]?.[mainDimension] ?? 0) + mainGap.value),
          0
        );
        let swapIdx: number | undefined;
        for (const key of groupAfter) {
          const itemSize = dimensions[key]?.[mainDimension];
          swapIdx = keyToIndex.value[key];
          if (itemSize && totalGroupSize + itemSize <= limit) {
            totalGroupSize += itemSize + mainGap.value;
          } else {
            break;
          }
        }
        if (swapIdx !== undefined) {
          const result = reorderInsert(indexToKey.value, activeIndex, swapIdx);
          if (
            areArraysDifferent(result, indexToKeyWithActiveInGroupAfter.value)
          ) {
            indexToKeyWithActiveInGroupAfter.value = result;
          }
        }
      }
    }
  );

  const layoutWithActiveInGroupBefore = useFlexLayout(
    indexToKeyWithActiveInGroupBefore
  );
  const layoutWithActiveInGroupAfter = useFlexLayout(
    indexToKeyWithActiveInGroupAfter
  );

  return ({ activeIndex, activeKey, position }) => {
    'worklet';
    let groupIndex = keyToGroup.value[activeKey];
    if (groupIndex === undefined) {
      return;
    }

    // GROUP BOUNDS

    let crossBeforeOffset = -Infinity;
    let crossBeforeBound = Infinity;

    do {
      if (crossBeforeOffset !== Infinity) {
        groupIndex--;
      }
      crossBeforeOffset =
        layoutWithActiveInGroupBefore.value?.crossAxisGroupOffsets[
          groupIndex
        ] ?? 0;
    } while (groupIndex > 0);
  };
};
