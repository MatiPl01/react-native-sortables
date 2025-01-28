import type { SharedValue } from 'react-native-reanimated';

import type { DebugRectUpdater } from '../../../../debug';
import type {
  Dimensions,
  FlexDirection,
  FlexLayout,
  Vector
} from '../../../../types';

const DEBUG_COLORS = {
  backgroundColor: '#ffa500',
  borderColor: '#825500'
};

export const updateLayoutDebugRects = (
  flexDirection: FlexDirection,
  layout: FlexLayout,
  debugCrossAxisGapRects: Array<DebugRectUpdater>,
  debugMainAxisGapRects: Array<DebugRectUpdater>,
  itemDimensions: SharedValue<Record<string, Dimensions>>
) => {
  'worklet';
  const isRow = flexDirection.startsWith('row');
  const isReverse = flexDirection.endsWith('reverse');

  let itemIndex = 0;

  for (let i = 0; i < layout.crossAxisGroupOffsets.length; i++) {
    const size = layout.crossAxisGroupSizes[i]!;
    const offset = layout.crossAxisGroupOffsets[i]!;
    const nextOffset = layout.crossAxisGroupOffsets[i + 1]!;
    const currentEndOffset = offset + size;

    if (isRow) {
      debugCrossAxisGapRects[i]?.set({
        ...DEBUG_COLORS,
        height: nextOffset - currentEndOffset,
        y: currentEndOffset
      });
    } else {
      debugCrossAxisGapRects[i]?.set({
        ...DEBUG_COLORS,
        width: nextOffset - currentEndOffset,
        x: currentEndOffset
      });
    }

    const group = layout.itemGroups[i];
    if (!group) break;

    for (let j = 0; j < group.length; j++) {
      const key = group[j]!;
      const nextKey = layout.itemGroups[i]![j + 1];

      if (!nextKey) {
        break;
      }

      const position = layout.itemPositions[key]!;
      const nextPosition = layout.itemPositions[nextKey]!;
      const dimensions = itemDimensions.value[key]!;
      const nextDimensions = itemDimensions.value[nextKey]!;

      // eslint-disable-next-line no-loop-func
      const set = (config: { from: Vector; to: Vector }) => {
        debugMainAxisGapRects[itemIndex]?.set({
          ...DEBUG_COLORS,
          from: config.from,
          to: config.to
        });
      };

      if (isRow && isReverse) {
        // row-reverse
        set({
          from: { x: nextPosition.x + nextDimensions.width, y: offset },
          to: { x: position.x, y: currentEndOffset }
        });
      } else if (isRow) {
        // row
        set({
          from: { x: position.x + dimensions.width, y: offset },
          to: { x: nextPosition.x, y: currentEndOffset }
        });
      } else if (isReverse) {
        // column-reverse
        set({
          from: { x: offset, y: nextPosition.y + nextDimensions.height },
          to: { x: currentEndOffset, y: position.y }
        });
      } else {
        // column
        set({
          from: { x: offset, y: position.y + dimensions.height },
          to: { x: currentEndOffset, y: nextPosition.y }
        });
      }

      itemIndex++;
    }
  }

  for (
    let i = layout.crossAxisGroupOffsets.length - 1;
    i < debugMainAxisGapRects.length;
    i++
  ) {
    debugCrossAxisGapRects[i]?.hide();
  }

  for (let i = itemIndex; i < debugMainAxisGapRects.length; i++) {
    debugMainAxisGapRects[i]?.hide();
  }
};
