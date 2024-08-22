import { useCallback } from 'react';
import {
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue
} from 'react-native-reanimated';

import { DebugRect } from '../../debug';
import { useCommonValuesContext, useFlexLayoutContext } from '../../providers';
import { repeat } from '../../utils';

const COLORS = {
  gap: {
    backgroundColor: '#ffa500',
    borderColor: '#825500'
  }
};

type GapProps = {
  index: number;
};

function RowGap({ index }: GapProps) {
  const { crossAxisGroupOffsets, rowGap } = useFlexLayoutContext();

  const y = useDerivedValue(() => crossAxisGroupOffsets.value[index + 1]);
  const visible = useDerivedValue(() => y.value !== undefined);

  return (
    <DebugRect
      {...COLORS.gap}
      height={rowGap}
      positionOrigin='bottom'
      visible={visible}
      y={y}
    />
  );
}

function ColumnGap({ index }: GapProps) {
  const {
    indexToKey,
    itemDimensions: itemDimensions_,
    itemPositions
  } = useCommonValuesContext();
  const {
    columnGap,
    crossAxisGroupOffsets,
    crossAxisGroupSizes,
    keyToGroup: keyToGroup_
  } = useFlexLayoutContext();

  const x = useSharedValue<null | number>(null);
  const y = useSharedValue<null | number>(null);
  const height = useSharedValue<null | number>(null);
  const visible = useSharedValue(false);

  const reset = useCallback(() => {
    'worklet';
    x.value = null;
    y.value = null;
    height.value = null;
    visible.value = false;
  }, [x, y, height, visible]);

  useAnimatedReaction(
    () => ({
      dimensions: itemDimensions_.value,
      groupOffsets: crossAxisGroupOffsets.value,
      groupSizes: crossAxisGroupSizes.value,
      idxToKey: indexToKey.value,
      keyToGroup: keyToGroup_.value,
      positions: itemPositions.value
    }),
    ({
      dimensions,
      groupOffsets,
      groupSizes,
      idxToKey,
      keyToGroup,
      positions
    }) => {
      const key = idxToKey[index];
      if (key === undefined) {
        return reset();
      }

      const itemPosition = positions[key];
      const itemDimensions = dimensions[key];
      const itemGroupIndex = keyToGroup[key];

      if (!itemPosition || !itemDimensions || itemGroupIndex === undefined) {
        return reset();
      }

      const groupOffset = groupOffsets[itemGroupIndex];
      const groupSize = groupSizes[itemGroupIndex];

      if (groupOffset === undefined || groupSize === undefined) {
        return reset();
      }

      x.value = itemPosition.x + itemDimensions.width;
      y.value = groupOffset;
      height.value = groupSize;
      visible.value = true;
    }
  );

  return (
    <DebugRect
      {...COLORS.gap}
      height={height}
      visible={visible}
      width={columnGap}
      x={x}
      y={y}
    />
  );
}

type FlexLayoutDebugViewProps = {
  itemsCount: number;
};

export default function FlexLayoutDebugView({
  itemsCount
}: FlexLayoutDebugViewProps) {
  return (
    <>
      {repeat(itemsCount - 1, (index: number) => (
        <RowGap index={index} key={index} />
      ))}
      {repeat(itemsCount - 1, (index: number) => (
        <ColumnGap index={index} key={index} />
      ))}
    </>
  );
}
