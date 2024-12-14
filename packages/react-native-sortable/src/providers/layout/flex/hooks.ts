import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';

import { reorderItems } from '../../../utils';
import {
  useCommonValuesContext,
  useLayoutDebugRects,
  useOrderUpdater
} from '../../shared';
import { useFlexLayoutContext } from './FlexLayoutProvider';
import type { AxisDimensions } from './utils';

const MIN_ADDITIONAL_OFFSET = 5;

const EMPTY_ARRAY: Array<string> = [];

export function useFlexOrderUpdater(): void {
  const { activeItemKey, indexToKey, itemDimensions } =
    useCommonValuesContext();
  const {
    adjustedCrossGap,
    crossAxisGroupOffsets,
    flexDirection,
    itemGroups,
    keyToGroup,
    referenceContainerDimensions
  } = useFlexLayoutContext();
  const { updateDebugRect } = useLayoutDebugRects();

  const isRow = flexDirection.startsWith('row');
  const axisDimensions: AxisDimensions = isRow
    ? { cross: 'height', main: 'width' }
    : { cross: 'width', main: 'height' };

  const indexToKeyWhenActiveInGroupBefore = useSharedValue(EMPTY_ARRAY);
  const indexToKeyWhenActiveInGroupAfter = useSharedValue(EMPTY_ARRAY);

  useAnimatedReaction(
    () => ({
      activeKey: activeItemKey.value,
      itemDimensions: itemDimensions.value,
      itemGroups: itemGroups.value,
      keyToGroup: keyToGroup.value,
      mainSizeLimit: referenceContainerDimensions.value[axisDimensions.main]
    }),
    props => {
      if (!props.activeKey) {
        return;
      }

      const groupIndex = props.keyToGroup[props.activeKey];
      if (groupIndex === undefined) {
        return;
      }

      const groupBeforeIndex = groupIndex - 1;
      if (groupBeforeIndex < 0) {
        return;
      }

      const activeItemDimensions = props.itemDimensions[props.activeKey];
      if (activeItemDimensions === undefined) {
        return;
      }

      if (props.mainSizeLimit === undefined) {
      } else {
        const groupBeforeItems = props.itemGroups[groupBeforeIndex];
        if (!groupBeforeItems) {
          return;
        }

        let groupBeforeMainSize = activeItemDimensions[axisDimensions.main];

        for (let i = 0; i < groupBeforeItems.length; i++) {
          const itemKey = groupBeforeItems[i];
          if (!itemKey) {
            break;
          }
          const currentItemDimensions = props.itemDimensions[itemKey];
          if (!currentItemDimensions) {
            break;
          }
          const currentItemMainSize =
            currentItemDimensions[axisDimensions.main];
          if (groupBeforeMainSize + currentItemMainSize > props.mainSizeLimit) {
            break;
          }
          groupBeforeMainSize += currentItemMainSize;
        }

        return reorderItems(props.indexToKey, groupBeforeItems);
      }
    }
  );

  useOrderUpdater(
    ({ activeKey, dimensions, strategy, touchPosition: { x, y } }) => {
      'worklet';
      const itemsCount = indexToKey.value.length;

      const startGroupIndex = keyToGroup.value[activeKey];
      if (startGroupIndex === undefined) {
        return;
      }
      // const startIndexInGroup =
      //   itemGroups.value[startGroupIndex]?.indexOf(activeKey);
      // if (startIndexInGroup === undefined) {
      //   return;
      // }

      let groupIndex = startGroupIndex;
      // const indexInGroup = startIndexInGroup;

      // CROSS AXIS BOUNDS
      // Bound before
      let crossAxisOffsetBefore = -Infinity;
      let crossAxisBoundBefore = Infinity;

      while (crossAxisBoundBefore > 0 && y < crossAxisBoundBefore) {
        if (crossAxisBoundBefore !== Infinity) {
          groupIndex--;
        }

        crossAxisOffsetBefore = crossAxisGroupOffsets.value[groupIndex] ?? 0;
        let groupBeforeCrossSize = dimensions[axisDimensions.cross];
        let groupBeforeMainSize = dimensions[axisDimensions.main];
        const limit = referenceContainerDimensions.value[axisDimensions.main];
        const itemsInGroupCount = itemGroups.value[groupIndex - 1]?.length ?? 0;
        let i = 0;

        while (
          (!limit || groupBeforeMainSize < limit) &&
          i < itemsInGroupCount
        ) {
          const itemKey = itemGroups.value[groupIndex - 1]?.[i];
          if (!itemKey) {
            break;
          }
          const currentItemDimensions = itemDimensions.value[itemKey];
          if (!currentItemDimensions) {
            break;
          }
          groupBeforeMainSize += currentItemDimensions[axisDimensions.main];
          groupBeforeCrossSize = Math.max(
            groupBeforeCrossSize,
            currentItemDimensions[axisDimensions.cross]
          );
          i++;
        }

        console.log(groupBeforeMainSize, groupBeforeCrossSize, i);

        // TODO - improve
        const additionalOffsetTop = Math.min(
          adjustedCrossGap.value / 2 + MIN_ADDITIONAL_OFFSET,
          adjustedCrossGap.value + groupBeforeCrossSize / 2
        );
        crossAxisBoundBefore = crossAxisOffsetBefore - additionalOffsetTop;
      }

      if (updateDebugRect) {
        // TODO - improve
        if (isRow) {
          updateDebugRect(
            'top',
            { x: 0, y: crossAxisBoundBefore },
            { x: 300, y: crossAxisOffsetBefore }
          );
        }
      }
    }
  );
}
