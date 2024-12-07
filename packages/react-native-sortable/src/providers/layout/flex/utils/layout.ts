import type {
  Dimension,
  Dimensions,
  Direction,
  Vector
} from '../../../../types';
import { reverseArray, sum } from '../../../../utils';
import type {
  AlignContent,
  AlignItems,
  FlexAlignments,
  FlexLayout,
  FlexLayoutProps,
  JustifyContent
} from '../types';

type AxisDimensions = { cross: Dimension; main: Dimension };
type AxisDirections = { cross: Direction; main: Direction };

const createGroups = (
  indexToKey: Array<string>,
  itemDimensions: Record<string, Dimensions>,
  axisDimensions: AxisDimensions,
  gap: number,
  groupMainSizeLimit: number
): {
  groups: Array<Array<string>>;
  crossAxisGroupSizes: Array<number>;
} | null => {
  'worklet';
  const groups: Array<Array<string>> = [];
  const crossAxisGroupSizes: Array<number> = [];

  let currentGroup: Array<string> = [];
  let totalGroupItemsMainSize = 0;
  let groupCrossSize = 0;

  for (const key of indexToKey) {
    const dimensions = itemDimensions[key];
    if (!dimensions) {
      return null;
    }
    const mainItemDimension = dimensions[axisDimensions.main];
    const crossItemDimension = dimensions[axisDimensions.cross];

    if (
      totalGroupItemsMainSize + currentGroup.length * gap + mainItemDimension >
      groupMainSizeLimit
    ) {
      groups.push(currentGroup);
      crossAxisGroupSizes.push(groupCrossSize);
      currentGroup = [];
      totalGroupItemsMainSize = 0;
      groupCrossSize = 0;
    }

    currentGroup.push(key);
    totalGroupItemsMainSize += mainItemDimension;
    if (crossItemDimension > groupCrossSize) {
      groupCrossSize = crossItemDimension;
    }
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
    crossAxisGroupSizes.push(groupCrossSize);
  }

  return { crossAxisGroupSizes, groups };
};

const calculateAlignment = (
  align: AlignContent | AlignItems | JustifyContent,
  sizes: Array<number>,
  containerSize: number,
  providedGap = 0
): {
  offsets: Array<number>;
  totalSize: number;
} => {
  'worklet';
  let startOffset = 0;
  let adjustedGap = providedGap;

  const getTotalSize = (gap: number) => sum(sizes) + gap * (sizes.length - 1);
  const totalSize = getTotalSize(providedGap);
  const adjustedContainerSize = Math.max(totalSize, containerSize);

  switch (align) {
    case 'flex-end':
      startOffset = adjustedContainerSize - totalSize;
      break;
    case 'center':
      startOffset = (adjustedContainerSize - totalSize) / 2;
      break;
    case 'stretch': {
      if (totalSize === 0) break;
      const multiplier = adjustedContainerSize / totalSize;
      const offsets = [0];
      for (let i = 0; i < sizes.length - 1; i++) {
        offsets.push(
          (offsets[i] ?? 0) + (sizes[i] ?? 0) * multiplier + providedGap
        );
      }
      return { offsets, totalSize };
    }
    case 'space-between':
      adjustedGap = Math.max(
        (adjustedContainerSize - sum(sizes)) / (sizes.length - 1),
        providedGap
      );
      break;
    case 'space-around':
      adjustedGap =
        (adjustedContainerSize - sum(sizes) + providedGap) / sizes.length;
      startOffset = (adjustedContainerSize - getTotalSize(adjustedGap)) / 2;
      break;
    case 'space-evenly':
      adjustedGap =
        (adjustedContainerSize - sum(sizes) + 2 * providedGap) /
        (sizes.length + 1);
      startOffset = (adjustedContainerSize - getTotalSize(adjustedGap)) / 2;
      break;
  }

  const offsets = [startOffset];

  for (let i = 0; i < sizes.length - 1; i++) {
    offsets.push((startOffset += (sizes[i] ?? 0) + adjustedGap));
  }

  return { offsets, totalSize: adjustedContainerSize };
};

const handleLayoutCalculation = (
  groups: Array<Array<string>>,
  crossAxisGroupSizes: Array<number>,
  itemDimensions: Record<string, Dimensions>,
  gaps: FlexLayoutProps['gaps'],
  axisDimensions: AxisDimensions,
  axisDirections: AxisDirections,
  { alignContent, alignItems, justifyContent }: FlexAlignments,
  referenceContainerDimensions: Partial<Dimensions>
) => {
  'worklet';
  const mainContainerDimension =
    referenceContainerDimensions[axisDimensions.main];
  if (!mainContainerDimension) {
    return null;
  }
  const isRow = axisDirections.main === 'row';

  // ALIGN CONTENT
  // position groups on the cross axis
  const contentAlignment = calculateAlignment(
    alignContent,
    crossAxisGroupSizes,
    referenceContainerDimensions[axisDimensions.cross] ?? 0,
    gaps[axisDirections.cross]
  );

  let totalHeight = isRow ? contentAlignment.totalSize : 0;
  const itemPositions: Record<string, Vector> = {};

  for (let i = 0; i < groups.length; i++) {
    // JUSTIFY CONTENT
    // position items in groups on the main axis
    const group = groups[i]!;
    const groupCrossSize = crossAxisGroupSizes[i]!;
    const groupCrossOffset = contentAlignment.offsets[i]!;
    const mainAxisGroupItemSizes: Array<number> = [];

    for (const key of group) {
      const itemSize = itemDimensions[key]?.[axisDimensions.main];
      if (itemSize === undefined) {
        return null;
      }
      mainAxisGroupItemSizes.push(itemSize);
    }

    const contentJustification = calculateAlignment(
      justifyContent,
      mainAxisGroupItemSizes,
      mainContainerDimension,
      gaps[axisDirections.main]
    );
    if (!isRow) {
      totalHeight = Math.max(totalHeight, contentJustification.totalSize);
    }

    for (let j = 0; j < group.length; j++) {
      // ALIGN ITEMS // TODO - override with alignSelf if specified for an item
      // position items in groups on the cross axis
      const key = group[j]!;
      const crossAxisItemSize = itemDimensions[key]?.[axisDimensions.cross];
      if (crossAxisItemSize === undefined) {
        return null;
      }

      const itemAlignment = calculateAlignment(
        alignItems,
        [crossAxisItemSize],
        groupCrossSize
      );

      const crossAxisPosition = groupCrossOffset + itemAlignment.offsets[0]!;
      const mainAxisPosition = contentJustification.offsets[j]!;

      if (isRow) {
        itemPositions[key] = { x: mainAxisPosition, y: crossAxisPosition };
      } else {
        itemPositions[key] = { x: crossAxisPosition, y: mainAxisPosition };
      }
    }
  }

  return {
    crossAxisGroupOffsets: contentAlignment.offsets,
    itemPositions,
    totalHeight
  };
};

export const calculateLayout = ({
  flexAlignments,
  flexDirection,
  flexWrap,
  gaps,
  indexToKey,
  itemDimensions,
  referenceContainerDimensions
}: FlexLayoutProps): FlexLayout | null => {
  'worklet';
  if (!referenceContainerDimensions.width) {
    return null;
  }

  // CREATE GROUPS
  // Determine the direction of the main axis and the parallel dimension
  const isRow = flexDirection.startsWith('row');
  const axisDimensions: AxisDimensions = isRow
    ? { cross: 'height', main: 'width' }
    : { cross: 'width', main: 'height' };
  const axisDirections: AxisDirections = isRow
    ? { cross: 'column', main: 'row' }
    : { cross: 'row', main: 'column' };

  const groupSizeLimit =
    flexWrap === 'nowrap'
      ? Infinity
      : (referenceContainerDimensions[axisDimensions.main] ?? Infinity);

  const groupingResult = createGroups(
    indexToKey,
    itemDimensions,
    axisDimensions,
    gaps[axisDirections.cross],
    groupSizeLimit
  );
  if (!groupingResult) {
    return null;
  }

  const { crossAxisGroupSizes, groups } = groupingResult;
  if (flexWrap === 'wrap-reverse') {
    reverseArray(groups);
    reverseArray(crossAxisGroupSizes);
  }

  // CALCULATE LAYOUT
  // based on item groups, gaps and alignment
  const layoutResult = handleLayoutCalculation(
    groups,
    crossAxisGroupSizes,
    itemDimensions,
    gaps,
    axisDimensions,
    axisDirections,
    flexAlignments,
    referenceContainerDimensions
  );
  if (!layoutResult) {
    return null;
  }

  return {
    crossAxisGroupOffsets: layoutResult.crossAxisGroupOffsets,
    crossAxisGroupSizes,
    itemGroups: groups,
    itemPositions: layoutResult.itemPositions,
    totalHeight: layoutResult.totalHeight
  };
};
