import { IS_WEB } from '../../../../constants';
import type {
  AlignContent,
  AlignItems,
  Dimension,
  Dimensions,
  Direction,
  FlexAlignments,
  FlexLayout,
  FlexLayoutProps,
  JustifyContent,
  Vector
} from '../../../../types';
import { reverseArray, sum } from '../../../../utils';

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

    const currentTotalSize =
      totalGroupItemsMainSize + currentGroup.length * gap + mainItemDimension;

    if (currentTotalSize > groupMainSizeLimit + 0.1) {
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
  minSize: number,
  maxSize: number,
  shouldWrap: boolean,
  providedGap = 0
): {
  offsets: Array<number>;
  totalSize: number;
  adjustedGap: number;
} => {
  'worklet';
  let startOffset = 0;
  let adjustedGap = providedGap;

  const getTotalSize = (gap: number) => sum(sizes) + gap * (sizes.length - 1);

  const totalSize = getTotalSize(providedGap);
  const clampedTotalSize = Math.min(
    Math.max(getTotalSize(providedGap), minSize),
    maxSize
  );

  switch (align) {
    case 'flex-end':
      startOffset = clampedTotalSize - totalSize;
      break;
    case 'center':
      startOffset = (clampedTotalSize - totalSize) / 2;
      break;
    case 'space-between':
      if (sizes.length > 1 || shouldWrap) {
        adjustedGap = Math.max(
          (clampedTotalSize - sum(sizes)) / (sizes.length - 1),
          providedGap
        );
      }
      break;
    case 'space-around':
      if (sizes.length > 1 || shouldWrap) {
        adjustedGap = Math.max(
          (clampedTotalSize - sum(sizes) + providedGap) / sizes.length,
          providedGap
        );
        if (adjustedGap > providedGap) {
          startOffset = (clampedTotalSize - getTotalSize(adjustedGap)) / 2;
        }
      }
      break;
    case 'space-evenly':
      if (sizes.length > 1 || shouldWrap) {
        adjustedGap = Math.max(
          (clampedTotalSize - sum(sizes) + 2 * providedGap) /
            (sizes.length + 1),
          providedGap
        );
        if (adjustedGap > providedGap) {
          startOffset = (clampedTotalSize - getTotalSize(adjustedGap)) / 2;
        }
      }
      break;
  }

  const offsets = [startOffset];

  for (let i = 0; i < sizes.length - 1; i++) {
    offsets.push((startOffset += (sizes[i] ?? 0) + adjustedGap));
  }

  return { adjustedGap, offsets, totalSize: clampedTotalSize };
};

const handleLayoutCalculation = (
  groups: Array<Array<string>>,
  crossAxisGroupSizes: Array<number>,
  itemDimensions: Record<string, Dimensions>,
  gaps: FlexLayoutProps['gaps'],
  axisDimensions: AxisDimensions,
  axisDirections: AxisDirections,
  { alignContent, alignItems, justifyContent }: FlexAlignments,
  paddings: FlexLayoutProps['paddings'],
  limits: NonNullable<FlexLayoutProps['limits']>,
  isReverse: boolean,
  shouldWrap: boolean
) => {
  'worklet';
  const isRow = axisDirections.main === 'row';
  const expandMultiGroup = !IS_WEB && groups.length > 1; // expands to max height/width
  const paddingHorizontal = paddings.left + paddings.right;
  const paddingVertical = paddings.top + paddings.bottom;

  let minMainContainerSize: number;
  let maxMainContainerSize: number;
  let minCrossContainerSize: number;
  let maxCrossContainerSize: number;

  if (isRow) {
    minMainContainerSize = limits.minWidth - paddingHorizontal;
    maxMainContainerSize = limits.maxWidth - paddingHorizontal;
    minCrossContainerSize = limits.minHeight - paddingVertical;
    maxCrossContainerSize = limits.maxHeight - paddingVertical;
  } else {
    minMainContainerSize = limits.minHeight - paddingVertical;
    maxMainContainerSize = limits.maxHeight - paddingVertical;
    minCrossContainerSize = limits.minWidth - paddingHorizontal;
    maxCrossContainerSize = limits.maxWidth - paddingHorizontal;
  }

  // ALIGN CONTENT
  // position groups on the cross axis
  const contentAlignment = calculateAlignment(
    alignContent,
    crossAxisGroupSizes,
    minCrossContainerSize,
    maxCrossContainerSize,
    shouldWrap,
    gaps[axisDirections.main]
  );

  let totalHeight = 0;
  let totalWidth = 0;

  if (isRow) {
    totalHeight = contentAlignment.totalSize + paddingVertical;
    totalWidth = expandMultiGroup ? limits.maxWidth : limits.minWidth;
  } else {
    totalHeight = expandMultiGroup ? limits.maxHeight : limits.minHeight;
    totalWidth = contentAlignment.totalSize + paddingHorizontal;
  }

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
      expandMultiGroup ? maxMainContainerSize : minMainContainerSize,
      maxMainContainerSize,
      shouldWrap,
      gaps[axisDirections.cross]
    );

    if (!expandMultiGroup) {
      if (isRow) {
        totalWidth = Math.max(
          totalWidth,
          contentJustification.totalSize + paddingHorizontal
        );
      } else {
        totalHeight = Math.max(
          totalHeight,
          contentJustification.totalSize + paddingVertical
        );
      }
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
        groupCrossSize,
        groupCrossSize,
        shouldWrap
      );

      const crossAxisPosition = groupCrossOffset + itemAlignment.offsets[0]!;
      const mainAxisPosition = contentJustification.offsets[j]!;

      if (isRow && isReverse) {
        // row-reverse
        itemPositions[key] = {
          x:
            totalWidth -
            mainAxisPosition -
            mainAxisGroupItemSizes[j]! -
            paddings.right,
          y: crossAxisPosition + paddings.top
        };
      } else if (isRow) {
        // row
        itemPositions[key] = {
          x: mainAxisPosition + paddings.left,
          y: crossAxisPosition + paddings.top
        };
      } else if (isReverse) {
        // column-reverse
        itemPositions[key] = {
          x: crossAxisPosition + paddings.left,
          y:
            totalHeight -
            mainAxisPosition -
            mainAxisGroupItemSizes[j]! -
            paddings.bottom
        };
      } else {
        // column
        itemPositions[key] = {
          x: crossAxisPosition + paddings.left,
          y: mainAxisPosition + paddings.top
        };
      }
    }
  }

  let additionalOffset = 0;
  if (isRow && isReverse) {
    // row-reverse
    additionalOffset = paddings.bottom;
  } else if (isRow) {
    // row
    additionalOffset = paddings.top;
  } else if (isReverse) {
    // column-reverse
    additionalOffset = paddings.right;
  } else {
    // column
    additionalOffset = paddings.left;
  }

  const crossAxisGroupOffsets = contentAlignment.offsets.map(
    offset => offset + additionalOffset
  );

  return {
    adjustedCrossGap: contentAlignment.adjustedGap,
    crossAxisGroupOffsets,
    itemPositions,
    totalDimensions: {
      height: totalHeight,
      width: totalWidth
    }
  };
};

export const calculateLayout = ({
  flexAlignments,
  flexDirection,
  flexWrap,
  gaps,
  indexToKey,
  itemDimensions,
  limits,
  paddings
}: FlexLayoutProps): FlexLayout | null => {
  'worklet';
  if (!limits) {
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

  const shouldWrap = flexWrap !== 'nowrap';
  let groupSizeLimit = Infinity;
  if (shouldWrap) {
    if (isRow) {
      groupSizeLimit = limits.maxWidth - paddings.left - paddings.right;
    } else {
      groupSizeLimit = limits.maxHeight - paddings.top - paddings.bottom;
    }
  }

  if (groupSizeLimit <= 0) {
    return null;
  }

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
  const isReverse = flexDirection.endsWith('reverse');
  const layoutResult = handleLayoutCalculation(
    groups,
    crossAxisGroupSizes,
    itemDimensions,
    gaps,
    axisDimensions,
    axisDirections,
    flexAlignments,
    paddings,
    limits,
    isReverse,
    shouldWrap
  );
  if (!layoutResult) {
    return null;
  }

  return {
    adjustedCrossGap: layoutResult.adjustedCrossGap,
    crossAxisGroupOffsets: layoutResult.crossAxisGroupOffsets,
    crossAxisGroupSizes,
    groupSizeLimit,
    itemGroups: groups,
    itemPositions: layoutResult.itemPositions,
    totalDimensions: layoutResult.totalDimensions
  };
};
