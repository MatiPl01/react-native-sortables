/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { useCallback, useMemo } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import { useAnimatedReaction } from 'react-native-reanimated';

import { MIN_EXTRA_SWAP_OFFSET } from '../../../constants';
import { useDebugContext } from '../../../debug';
import type { Coordinate, Dimension } from '../../../types';
import { reorderItems } from '../../../utils';
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

function useSwapDebugRectsUpdater() {
  'worklet';
  const { activeItemKey } = useCommonValuesContext();
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

  const updater = useCallback(
    (
      coordinates: { main: Coordinate; cross: Coordinate },
      gaps: { main: SharedValue<number>; cross: SharedValue<number> },
      offsets: {
        main: { before: number; after: number };
        cross: { before: number; after: number };
      },
      bounds: {
        main: { before: number | undefined; after: number | undefined };
        cross: { before: number; after: number };
      }
    ) => {
      'worklet';
      if (!debugRects) {
        return;
      }

      // For row direction
      if (coordinates.main === 'x' && coordinates.cross === 'y') {
        debugRects.crossBefore.set({
          ...DEBUG_COLORS,
          from: { x: offsets.main.before, y: bounds.cross.before },
          to: { x: offsets.main.after, y: offsets.cross.before }
        });
        debugRects.crossAfter.set({
          ...DEBUG_COLORS,
          from: {
            x: offsets.main.before,
            y: offsets.cross.after - gaps.cross.value
          },
          to: { x: offsets.main.after, y: bounds.cross.after }
        });

        if (bounds.main.before !== undefined) {
          debugRects.mainBefore.set({
            ...DEBUG_COLORS,
            from: { x: bounds.main.before, y: bounds.cross.before },
            to: {
              x: Math.max(offsets.main.before, bounds.main.before),
              y: bounds.cross.after
            }
          });
        } else {
          debugRects.mainBefore.hide();
        }

        if (bounds.main.after !== undefined) {
          debugRects.mainAfter.set({
            ...DEBUG_COLORS,
            from: {
              x: Math.min(offsets.main.after, bounds.main.after),
              y: bounds.cross.before
            },
            to: { x: bounds.main.after, y: bounds.cross.after }
          });
        } else {
          debugRects.mainAfter.hide();
        }
      }
      // For column direction
      else if (coordinates.main === 'y' && coordinates.cross === 'x') {
        debugRects.crossBefore.set({
          ...DEBUG_COLORS,
          from: { x: bounds.cross.before, y: offsets.main.before },
          to: { x: offsets.cross.before, y: offsets.main.after }
        });
        debugRects.crossAfter.set({
          ...DEBUG_COLORS,
          from: {
            x: offsets.cross.after - gaps.cross.value,
            y: offsets.main.before
          },
          to: { x: bounds.cross.after, y: offsets.main.after }
        });

        if (bounds.main.before !== undefined) {
          debugRects.mainBefore.set({
            ...DEBUG_COLORS,
            from: { x: bounds.cross.before, y: bounds.main.before },
            to: {
              x: bounds.cross.after,
              y: Math.max(offsets.main.before, bounds.main.before)
            }
          });
        } else {
          debugRects.mainBefore.hide();
        }

        if (bounds.main.after !== undefined) {
          debugRects.mainAfter.set({
            ...DEBUG_COLORS,
            from: {
              x: bounds.cross.before,
              y: Math.min(offsets.main.after, bounds.main.after)
            },
            to: { x: bounds.cross.after, y: bounds.main.after }
          });
        } else {
          debugRects.mainAfter.hide();
        }
      }
    },
    [debugRects]
  );

  return debugRects ? updater : null;
}

export function useFlexOrderUpdater(): void {
  const { indexToKey, itemDimensions, itemPositions } =
    useCommonValuesContext();
  const { crossAxisGroupOffsets, flexDirection, keyToGroup } =
    useFlexLayoutContext();
  const { coordinates, dimensions, gaps } = useAxisParams(flexDirection);

  const updateDebugRects = useSwapDebugRectsUpdater();

  useOrderUpdater(
    ({ activeIndex, activeKey, position, strategy, touchPosition }) => {
      'worklet';
      const groupIndex = keyToGroup.value[activeKey];
      if (groupIndex === undefined) {
        return;
      }

      // Get active item bounding box
      const crossOffsetBefore = crossAxisGroupOffsets.value[groupIndex];
      const crossOffsetAfter = crossAxisGroupOffsets.value[groupIndex + 1];
      if (crossOffsetBefore === undefined || crossOffsetAfter === undefined) {
        return;
      }
      const mainOffsetBefore =
        itemPositions.value[activeKey]?.[coordinates.main];
      const activeItemMainSize =
        itemDimensions.value[activeKey]?.[dimensions.main];
      if (mainOffsetBefore === undefined || activeItemMainSize === undefined) {
        return;
      }
      const mainOffsetAfter = mainOffsetBefore + activeItemMainSize;

      // CROSS AXIS
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

      // MAIN AXIS
      const itemBeforeKey = indexToKey.value[activeIndex - 1];
      const itemAfterKey = indexToKey.value[activeIndex + 1];
      let mainBeforeBound: number | undefined;
      let mainAfterBound: number | undefined;

      // Main axis before bound
      if (
        itemBeforeKey !== undefined &&
        keyToGroup.value[itemBeforeKey] === groupIndex
      ) {
        const itemBeforeMainPosition =
          itemPositions.value[itemBeforeKey]?.[coordinates.main];
        const activeItemLayoutMainPosition =
          itemPositions.value[activeKey]?.[coordinates.main];
        const itemBeforeMainSize =
          itemDimensions.value[itemBeforeKey]?.[dimensions.main];

        if (
          itemBeforeMainPosition === undefined ||
          activeItemLayoutMainPosition === undefined ||
          itemBeforeMainSize === undefined
        ) {
          return;
        }

        const additionalMainOffsetBefore = Math.min(
          gaps.main.value / 2 + MIN_EXTRA_SWAP_OFFSET,
          gaps.main.value + itemBeforeMainSize / 2
        );
        mainBeforeBound =
          (itemBeforeMainPosition +
            activeItemLayoutMainPosition +
            activeItemMainSize) /
            2 -
          additionalMainOffsetBefore;
      }

      // Main axis after bound
      if (
        itemAfterKey !== undefined &&
        keyToGroup.value[itemAfterKey] === groupIndex
      ) {
        const itemAfterMainPosition =
          itemPositions.value[itemAfterKey]?.[coordinates.main];
        const activeItemLayoutMainPosition =
          itemPositions.value[activeKey]?.[coordinates.main];
        const itemAfterMainSize =
          itemDimensions.value[itemAfterKey]?.[dimensions.main];

        if (
          itemAfterMainPosition === undefined ||
          activeItemLayoutMainPosition === undefined ||
          itemAfterMainSize === undefined
        ) {
          return;
        }

        const additionalMainOffsetAfter = Math.min(
          gaps.main.value / 2 + MIN_EXTRA_SWAP_OFFSET,
          gaps.main.value + itemAfterMainSize / 2
        );
        mainAfterBound =
          (itemAfterMainPosition +
            activeItemLayoutMainPosition +
            itemAfterMainSize) /
            2 +
          additionalMainOffsetAfter;
      }

      // FOR DEBUGGING PURPOSES
      if (updateDebugRects) {
        updateDebugRects(
          coordinates,
          gaps,
          {
            cross: {
              after: crossOffsetAfter,
              before: crossOffsetBefore
            },
            main: {
              after: mainOffsetAfter,
              before: mainOffsetBefore
            }
          },
          {
            cross: {
              after: crossAfterBound,
              before: crossBeforeBound
            },
            main: {
              after: mainAfterBound,
              before: mainBeforeBound
            }
          }
        );
      }

      // Check if touch cross axis position is over the top or the
      // bottom bound
      // let dy = 0;
      // if (
      //   crossBeforeBound > 0 &&
      //   touchPosition[coordinates.cross] < crossBeforeBound
      // ) {
      //   dy = -1;
      // } else if (
      //   crossAfterBound < 0 &&
      //   touchPosition[coordinates.cross] > crossAfterBound
      // ) {
      //   dy = 1;
      // }

      // Check if touch main axis position is over the left or the
      // right edge bound
      let dx = 0;
      if (
        mainBeforeBound !== undefined &&
        touchPosition[coordinates.main] < mainBeforeBound
      ) {
        dx = -1;
      } else if (
        mainAfterBound !== undefined &&
        touchPosition[coordinates.main] > mainAfterBound
      ) {
        dx = 1;
      }

      if (dx === 0) {
        return;
      }

      return reorderItems(
        indexToKey.value,
        activeIndex,
        activeIndex + dx,
        strategy
      );
    },
    [flexDirection]
  );
}
