import { useDerivedValue } from 'react-native-reanimated';

import { DebugRect } from '../../debug';
import { useGridLayoutContext } from '../../providers';
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
    </>
  );
}
