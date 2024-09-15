/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { useMemo } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import { useAnimatedReaction } from 'react-native-reanimated';

import { MIN_EXTRA_SWAP_OFFSET } from '../../../constants';
import { useDebugContext } from '../../../debug';
import type { Coordinate, Dimension } from '../../../types';
import { useCommonValuesContext, useOrderUpdater } from '../../shared';
import { useFlexLayoutContext } from './FlexLayoutProvider';
import type {
  FlexColumnAxisParams,
  FlexDirection,
  FlexRowAxisParams,
  RowFlexDirection
} from './types';

const DEBUG_COLORS = {
  backgroundColor: '#1111ef',
  borderColor: '#00007e'
};

function useAxisParams<T extends FlexDirection>(
  flexDirection: T
): T extends RowFlexDirection ? FlexRowAxisParams : FlexColumnAxisParams {
  const { columnGap, rowGap } = useFlexLayoutContext();

  let mainCoordinate: Coordinate = 'x';
  let crossCoordinate: Coordinate = 'y';
  let mainDimension: Dimension = 'width';
  let crossDimension: Dimension = 'height';
  let crossAxisGap: SharedValue<number> = rowGap;
  let mainAxisGap: SharedValue<number> = columnGap;

  if (flexDirection.startsWith('column')) {
    mainCoordinate = 'y';
    crossCoordinate = 'x';
    mainDimension = 'height';
    crossDimension = 'width';
    crossAxisGap = columnGap;
    mainAxisGap = rowGap;
  }

  return useMemo(
    () =>
      ({
        coordinates: {
          cross: crossCoordinate,
          main: mainCoordinate
        },
        dimensions: {
          cross: crossDimension,
          main: mainDimension
        },
        gaps: {
          cross: crossAxisGap,
          main: mainAxisGap
        }
      }) as any,
    [
      crossCoordinate,
      mainCoordinate,
      crossDimension,
      mainDimension,
      crossAxisGap,
      mainAxisGap
    ]
  );
}

export function useFlexOrderUpdater(): void {
  const {
    activeItemKey,
    indexToKey,
    itemDimensions,
    itemPositions,
    keyToIndex
  } = useCommonValuesContext();
  const { crossAxisGroupOffsets, flexDirection, itemGroups, keyToGroup } =
    useFlexLayoutContext();
  const { coordinates, dimensions, gaps } = useAxisParams(flexDirection);

  const debugContext = useDebugContext();

  const debugRects = debugContext?.useDebugRects([
    'crossBefore',
    'crossAfter',
    'mainBefore',
    'mainAfter'
  ]);

  useAnimatedReaction(
    () => activeItemKey.value,
    () => {
      if (debugRects && activeItemKey.value === null) {
        Object.values(debugRects).forEach(rect => rect.hide());
      }
    }
  );

  useOrderUpdater(
    ({ activeIndex, activeKey, position, strategy, touchPosition }) => {
      'worklet';
      const groupIndex = keyToGroup.value[activeKey];
      if (groupIndex === undefined) {
        return;
      }

      // Get active item cross axis bounds
      const crossOffsetBefore = crossAxisGroupOffsets.value[groupIndex];
      const crossOffsetAfter = crossAxisGroupOffsets.value[groupIndex + 1];
      if (crossOffsetBefore === undefined || crossOffsetAfter === undefined) {
        return;
      }

      // Cross axis before bound
      const groupBeforeSize =
        crossAxisGroupOffsets.value[groupIndex - 1] !== undefined
          ? crossOffsetBefore -
            crossAxisGroupOffsets.value[groupIndex - 1]! -
            gaps.cross.value
          : 0;
      const additionalCrossOffsetBefore = Math.min(
        gaps.cross.value / 2 + MIN_EXTRA_SWAP_OFFSET,
        gaps.cross.value + groupBeforeSize / 2
      );
      const crossBeforeBound = crossOffsetBefore - additionalCrossOffsetBefore;

      // Cross axis after bound
      const groupAfterSize =
        crossAxisGroupOffsets.value[groupIndex + 2] !== undefined
          ? crossAxisGroupOffsets.value[groupIndex + 2]! -
            crossOffsetAfter -
            gaps.cross.value
          : 0;
      const additionalCrossOffsetAfter = Math.min(
        gaps.cross.value / 2 + MIN_EXTRA_SWAP_OFFSET,
        gaps.cross.value + groupAfterSize / 2
      );
      const crossAfterBound =
        crossOffsetAfter - gaps.cross.value + additionalCrossOffsetAfter;

      // FOR DEBUGGING PURPOSES
      if (debugRects) {
        // For row direction
        if (coordinates.main === 'x' && coordinates.cross === 'y') {
          debugRects.crossBefore.set({
            ...DEBUG_COLORS,
            from: { x: 0, y: crossBeforeBound },
            to: { x: 1000, y: crossOffsetBefore }
          });
          debugRects.crossAfter.set({
            ...DEBUG_COLORS,
            from: { x: 0, y: crossOffsetAfter - gaps.cross.value },
            to: { x: 1000, y: crossAfterBound }
          });
        }
        // For column direction
        else if (coordinates.main === 'y' && coordinates.cross === 'x') {
          debugRects.crossBefore.set({
            ...DEBUG_COLORS,
            from: { x: crossBeforeBound, y: 0 },
            to: { x: crossOffsetBefore, y: 1000 }
          });
          debugRects.crossAfter.set({
            ...DEBUG_COLORS,
            from: { x: crossOffsetAfter - gaps.cross.value, y: 0 },
            to: { x: crossAfterBound, y: 1000 }
          });
        }
        // debugRects.crossAfter.set({
        //   ...DEBUG_COLORS,
        //   from: { [crossCoordinate]: crossAfterBound, [mainCoordinate]: 0 },
        //   to: { [crossCoordinate]: crossAfterBound, [mainCoordinate]: 1000 }
        // });
      }

      // // Select the group in which the active item is currently located
      // let offsetBefore = crossAxisGroupOffsets.value[groupIndex];
      // while (
      //   offsetBefore !== undefined &&
      //   groupIndex >= 0 &&
      //   touchPosition[crossCoordinate] < offsetBefore
      // ) {
      //   groupIndex -= 1;
      //   offsetBefore = crossAxisGroupOffsets.value[groupIndex];
      // }

      // let offsetAfter = crossAxisGroupOffsets.value[groupIndex + 1];
      // while (
      //   offsetAfter !== undefined &&
      //   groupIndex < itemGroups.value.length &&
      //   touchPosition[crossCoordinate] > offsetAfter
      // ) {
      //   groupIndex += 1;
      //   offsetAfter = crossAxisGroupOffsets.value[groupIndex + 1];
      // }

      // // Check if the active item center is overlapping with another item
      // // within the same group
      // let overlappingItemKey: string | undefined;
      // const group = itemGroups.value[groupIndex];
      // if (!group) {
      //   return;
      // }
      // for (const key of group) {
      //   if (key === activeKey) {
      //     continue;
      //   }

      //   const otherDimensions = itemDimensions.value[key];
      //   if (!otherDimensions) {
      //     continue;
      //   }
      //   const otherPosition = itemPositions.value[key];
      //   if (!otherPosition) {
      //     continue;
      //   }

      //   // Item before the active item in the group
      //   if (otherPosition[mainCoordinate] < position[mainCoordinate]) {
      //     const otherEnd =
      //       otherPosition[mainCoordinate] + otherDimensions[mainDimension];
      //     if (otherEnd > touchPosition[mainCoordinate]) {
      //       overlappingItemKey = key;
      //       break;
      //     }
      //   }

      //   // Item after the active item in the group
      //   if (otherPosition[mainCoordinate] > position[mainCoordinate]) {
      //     const otherStart = otherPosition[mainCoordinate];
      //     if (otherStart < touchPosition[mainCoordinate]) {
      //       overlappingItemKey = key;
      //       break;
      //     }
      //   }
      // }

      // if (overlappingItemKey === undefined) {
      //   return;
      // }
      // const overlappingIndex = keyToIndex.value[overlappingItemKey];
      // if (overlappingIndex === undefined) {
      //   return;
      // }

      // // Return the new order of items
      // return reorderItems(
      //   indexToKey.value,
      //   activeIndex,
      //   overlappingIndex,
      //   strategy
      // );
      return;
    },
    [flexDirection]
  );
}
