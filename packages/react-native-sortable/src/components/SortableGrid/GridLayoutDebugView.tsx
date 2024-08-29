import {
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue
} from 'react-native-reanimated';

import { DebugLine, DebugRect } from '../../debug';
import { useCommonValuesContext, useGridLayoutContext } from '../../providers';
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
  const { rowGap, rowOffsets } = useGridLayoutContext();

  const y = useDerivedValue(() => rowOffsets.value[index + 1]);

  return (
    <DebugRect {...COLORS.gap} height={rowGap} positionOrigin='bottom' y={y} />
  );
}

function ColumnGap({ index }: GapProps) {
  const { columnGap, columnWidth } = useGridLayoutContext();

  const x = useDerivedValue(
    () => (columnWidth.value + columnGap.value) * (index + 1)
  );

  return (
    <DebugRect {...COLORS.gap} positionOrigin='right' width={columnGap} x={x} />
  );
}

function TouchPosition() {
  const { touchPosition } = useCommonValuesContext();

  const x = useSharedValue<null | number>(null);
  const y = useSharedValue<null | number>(null);
  const visible = useSharedValue(false);

  useAnimatedReaction(
    () => touchPosition.value,
    position => {
      if (position) {
        visible.value = true;
        x.value = position.x;
        y.value = position.y;
      } else {
        visible.value = false;
      }
    }
  );
  return (
    <>
      <DebugLine color='red' visible={visible} x={x} />
      <DebugLine color='red' visible={visible} y={y} />
      {/* <DebugRect from={touchStartPosition} to={to} visible={visible} /> */}
    </>
  );
}

type GridLayoutDebugViewProps = {
  itemsCount: number;
  columns: number;
};

export default function GridLayoutDebugView({
  columns,
  itemsCount
}: GridLayoutDebugViewProps) {
  const rowsCount = Math.ceil(itemsCount / columns);

  return (
    <>
      {repeat(rowsCount - 1, (index: number) => (
        <RowGap index={index} key={index} />
      ))}
      {repeat(columns - 1, (index: number) => (
        <ColumnGap index={index} key={index} />
      ))}
      <TouchPosition />
    </>
  );
}
