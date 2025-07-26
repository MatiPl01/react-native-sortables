import type { DebugRectUpdater } from '../../../../debug';
import type { FlexDirection, FlexLayout, Vector } from '../../../../types';
import { resolveDimension } from '../../../shared';

const DEBUG_COLORS = {
  backgroundColor: '#ffa500',
  borderColor: '#825500'
};

export const updateLayoutDebugRects = (
  flexDirection: FlexDirection,
  layout: FlexLayout,
  debugCrossAxisGapRects: Array<DebugRectUpdater>,
  debugMainAxisGapRects: Array<DebugRectUpdater>,
  itemWidths: number | Record<string, number>,
  itemHeights: number | Record<string, number>
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

    const set = (index: number, config: { from: Vector; to: Vector }) => {
      debugMainAxisGapRects[index]?.set({
        ...DEBUG_COLORS,
        from: config.from,
        to: config.to
      });
    };

    for (let j = 0; j < group.length; j++) {
      const key = group[j]!;
      const nextKey = layout.itemGroups[i]![j + 1];

      if (!nextKey) {
        break;
      }

      const position = layout.itemPositions[key]!;
      const nextPosition = layout.itemPositions[nextKey]!;

      if (isRow && isReverse) {
        // row-reverse
        set(itemIndex, {
          from: {
            x: nextPosition.x + resolveDimension(itemWidths, nextKey)!,
            y: offset
          },
          to: { x: position.x, y: currentEndOffset }
        });
      } else if (isRow) {
        // row
        set(itemIndex, {
          from: {
            x: position.x + resolveDimension(itemWidths, key)!,
            y: offset
          },
          to: { x: nextPosition.x, y: currentEndOffset }
        });
      } else if (isReverse) {
        // column-reverse
        set(itemIndex, {
          from: {
            x: offset,
            y: nextPosition.y + resolveDimension(itemHeights, nextKey)!
          },
          to: { x: currentEndOffset, y: position.y }
        });
      } else {
        // column
        set(itemIndex, {
          from: {
            x: offset,
            y: position.y + resolveDimension(itemHeights, key)!
          },
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
