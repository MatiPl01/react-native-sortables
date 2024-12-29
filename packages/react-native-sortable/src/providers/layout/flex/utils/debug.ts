import type { SharedValue } from 'react-native-reanimated';

import type { DebugRectUpdater } from '../../../../debug';
import type { Dimensions, FlexLayout } from '../../../../types';

const DEBUG_COLORS = {
  backgroundColor: '#ffa500',
  borderColor: '#825500'
};

export const updateLayoutDebugRects = (
  layout: FlexLayout,
  debugCrossAxisGapRects: Array<DebugRectUpdater>,
  debugMainAxisGapRects: Array<DebugRectUpdater>,
  itemDimensions: SharedValue<Record<string, Dimensions>>
) => {
  'worklet';

  let itemIndex = 0;

  for (let i = 0; i < layout.crossAxisGroupOffsets.length; i++) {
    const size = layout.crossAxisGroupSizes[i]!;
    const offset = layout.crossAxisGroupOffsets[i]!;
    const nextOffset = layout.crossAxisGroupOffsets[i + 1]!;
    const y = offset + size;

    debugCrossAxisGapRects[i]?.set({
      ...DEBUG_COLORS,
      height: nextOffset - y,
      y
    });

    for (let j = 0; j < layout.itemGroups[i]!.length; j++) {
      const key = layout.itemGroups[i]![j]!;
      const nextKey = layout.itemGroups[i]![j + 1];

      if (!nextKey) {
        break;
      }

      const position = layout.itemPositions[key]!;
      const nextPosition = layout.itemPositions[nextKey]!;
      const dimensions = itemDimensions.value[key]!;

      debugMainAxisGapRects[itemIndex]?.set({
        ...DEBUG_COLORS,
        from: { x: position.x + dimensions.width, y: offset },
        to: { x: nextPosition.x, y }
      });

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
