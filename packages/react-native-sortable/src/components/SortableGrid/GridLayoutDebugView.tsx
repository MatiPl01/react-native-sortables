// import {
//   useAnimatedReaction,
//   useDerivedValue,
//   useSharedValue
// } from 'react-native-reanimated';

// import { DebugLine, DebugRect, DebugTouchPosition } from '../../debug';
// import { useCommonValuesContext, useGridLayoutContext } from '../../providers';
// import { getGridItemBoundingBox } from '../../providers/layout/grid/utils';
// import { repeat } from '../../utils';

// const COLORS = {
//   gap: {
//     backgroundColor: '#ffa500',
//     borderColor: '#825500'
//   },
//   swapZone: {
//     backgroundColor: '#1111ef',
//     borderColor: '#00007e'
//   }
// };

// type GapProps = {
//   index: number;
// };

// function RowGap({ index }: GapProps) {
//   const { rowGap, rowOffsets } = useGridLayoutContext();

//   const y = useDerivedValue(() => rowOffsets.value[index + 1]);

//   return (
//     <DebugRect {...COLORS.gap} height={rowGap} positionOrigin='bottom' y={y} />
//   );
// }

// function ColumnGap({ index }: GapProps) {
//   const { columnGap, columnWidth } = useGridLayoutContext();

//   const x = useDerivedValue(
//     () => (columnWidth.value + columnGap.value) * (index + 1)
//   );

//   return (
//     <DebugRect {...COLORS.gap} positionOrigin='right' width={columnGap} x={x} />
//   );
// }

// type BoundarySwapZoneProps = {
//   columns: number;
// };

// function BoundarySwapZone({ columns }: BoundarySwapZoneProps) {
//   const { activeItemKey, itemDimensions, keyToIndex } =
//     useCommonValuesContext();
//   const { rowOffsets } = useGridLayoutContext();

//   const topY = useSharedValue<null | number>(null);
//   const topHeight = useSharedValue<null | number>(null);
//   const bottomY = useSharedValue<null | number>(null);
//   const bottomHeight = useSharedValue<null | number>(null);
//   const leftX = useSharedValue<null | number>(null);
//   const leftWidth = useSharedValue<null | number>(null);
//   const rightX = useSharedValue<null | number>(null);
//   const rightWidth = useSharedValue<null | number>(null);

//   useAnimatedReaction(
//     () => {
//       const key = activeItemKey.value;
//       if (key === null) {
//         return;
//       }

//       const activeIndex = keyToIndex.value[key];
//       if (activeIndex === undefined) {
//         return;
//       }

//       const dimensions = itemDimensions.value[key];
//       if (!dimensions) {
//         return;
//       }

//       return {
//         activeIndex,
//         dimensions,
//         offsets: rowOffsets.value
//       };
//     },
//     data => {
//       if (!data) {
//         return;
//       }
//       const { activeIndex, dimensions, offsets } = data;

//       const bounds = getGridItemBoundingBox(
//         activeIndex,
//         numColumns,
//         columnWidth.value,
//         rowOffsets.value,
//         { column: columnGap.value, row: rowGap.value }
//       );
//       if (!bounds) {
//         return;
//       }

//       topY.value = bounds.y1;
//       bottomY.value = bounds.y2 ?? null;
//       leftX.value = bounds.x1;
//       rightX.value = bounds.x2;
//     },
//     [columns]
//   );

//   return (
//     <>
//       <DebugLine color={COLORS.swapZone.borderColor} x={leftX} />
//       <DebugLine color={COLORS.swapZone.borderColor} x={rightX} />
//       <DebugLine color={COLORS.swapZone.borderColor} y={topY} />
//       <DebugLine color={COLORS.swapZone.borderColor} y={bottomY} />
//     </>
//   );
// }

// type GridLayoutDebugViewProps = {
//   itemsCount: number;
//   columns: number;
// };

// export default function GridLayoutDebugView({
//   columns,
//   itemsCount
// }: GridLayoutDebugViewProps) {
//   const rowsCount = Math.ceil(itemsCount / columns);

//   return (
//     <>
//       {repeat(rowsCount - 1, (index: number) => (
//         <RowGap index={index} key={index} />
//       ))}
//       {repeat(columns - 1, (index: number) => (
//         <ColumnGap index={index} key={index} />
//       ))}
//       <BoundarySwapZone columns={columns} />
//       <DebugTouchPosition />
//     </>
//   );
// }
