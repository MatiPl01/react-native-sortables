import { OFFSET_EPS } from '@/constants';
import type { Dimension, Dimensions, Position } from '@/types';
import { sum } from '@/utils';

import type {
  AlignContent,
  AlignItems,
  FlexProps,
  JustifyContent
} from './types';

export const areDimensionsCorrect = (dimensions: Dimensions): boolean => {
  'worklet';
  return dimensions.width >= 0 && dimensions.height >= 0;
};

export const groupItems = (
  indexToKey: Array<string>,
  dimensions: Record<string, Dimensions>,
  itemsGap: number,
  limitedDimension: 'height' | 'width',
  limit: number
): Array<Array<string>> | null => {
  'worklet';
  const groups: Array<Array<string>> = [];
  let currentGroup: Array<string> = [];
  let currentDimension = 0;

  for (const key of indexToKey) {
    const itemDimensions = dimensions[key];
    if (!itemDimensions) {
      return null;
    }
    const itemDimension = itemDimensions[limitedDimension];
    const gap = currentGroup.length > 0 ? itemsGap : 0;
    if (currentDimension + itemDimension - limit > OFFSET_EPS) {
      groups.push(currentGroup);
      currentGroup = [];
      currentDimension = 0;
    }

    currentGroup.push(key);
    currentDimension += itemDimension + gap;
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
};

export const getGroupSizes = (
  groups: Array<Array<string>>,
  itemDimensions: Record<string, Dimensions>,
  sizeBy: 'height' | 'width'
): Array<number> => {
  'worklet';
  return groups.map(group =>
    Math.max(...group.map(key => itemDimensions[key]?.[sizeBy] ?? 0))
  );
};

const alignHelper = (
  align: AlignContent | JustifyContent,
  gapProp: number,
  sizes: Array<number>,
  containerSize: number
): Array<number> => {
  'worklet';
  let startOffset = 0;
  let adjustedGap = gapProp;

  const getTotalSize = (gap: number) => sum(sizes) + gap * (sizes.length - 1);

  switch (align) {
    case 'flex-end':
      startOffset = containerSize - getTotalSize(gapProp);
      break;
    case 'center':
      startOffset = (containerSize - getTotalSize(gapProp)) / 2;
      break;
    case 'space-between':
      adjustedGap = Math.max(
        (containerSize - sum(sizes)) / (sizes.length - 1),
        gapProp
      );
      break;
    case 'space-evenly':
      adjustedGap =
        (containerSize - sum(sizes) + 2 * gapProp) / (sizes.length + 1);
      startOffset = (containerSize - getTotalSize(adjustedGap)) / 2;
      break;
    case 'space-around':
      adjustedGap = (containerSize - sum(sizes) + gapProp) / sizes.length;
      startOffset = (containerSize - getTotalSize(adjustedGap)) / 2;
      break;
    case 'stretch': {
      const totalSize = getTotalSize(gapProp);
      if (totalSize === 0) break;
      const multiplier = containerSize / totalSize;
      const offsets = [0];
      for (let i = 0; i < sizes.length - 1; i++) {
        offsets.push(
          (offsets[i] ?? 0) + (sizes[i] ?? 0) * multiplier + gapProp
        );
      }
      return offsets;
    }
  }

  const offsets = [startOffset];

  for (let i = 0; i < sizes.length - 1; i++) {
    offsets.push((startOffset += (sizes[i] ?? 0) + adjustedGap));
  }

  return offsets;
};

const alignFlexContent = (
  align: AlignContent,
  gap: number,
  groupSizes: Array<number>,
  containerSize: number
): Array<number> => {
  'worklet';
  return alignHelper(align, gap, groupSizes, containerSize);
};

const justifyGroupItems = (
  justify: JustifyContent,
  gap: number,
  groupItemSizes: Array<number>,
  containerSize: number
): Array<number> => {
  'worklet';
  return alignHelper(justify, gap, groupItemSizes, containerSize);
};

const alignGroupItems = (
  align: AlignItems,
  groupItemSizes: Array<number>,
  groupSize: number
): Array<number> => {
  'worklet';

  switch (align) {
    case 'flex-end':
      return groupItemSizes.map(itemSize => groupSize - itemSize);
    case 'center':
      return groupItemSizes.map(itemSize => (groupSize - itemSize) / 2);
    default:
      return groupItemSizes.map(() => 0);
  }
};

export const calculateLayout = (
  groups: Array<Array<string>>,
  groupBy: Dimension,
  crossAxisGroupSizes: Array<number>,
  itemDimensions: Record<string, Dimensions>,
  containerDimensions: Dimensions,
  {
    alignContent,
    alignItems,
    columnGap,
    flexWrap,
    justifyContent,
    rowGap
  }: Pick<
    Required<FlexProps>,
    | 'alignContent'
    | 'alignItems'
    | 'columnGap'
    | 'flexWrap'
    | 'justifyContent'
    | 'rowGap'
  >
): {
  crossAxisGroupOffsets: Array<number>;
  itemPositions: Record<string, Position>;
} | null => {
  'worklet';
  const positions: Record<string, Position> = {};

  const mainAxisDimension = groupBy;
  let crossAxisDimension: Dimension = 'height';
  let groupsGap: number = rowGap;
  let itemsGap: number = columnGap;
  let mainAxisContainerSize: number = containerDimensions.width;
  let crossAxisContainerSize: number = containerDimensions.height;

  if (groupBy === 'height') {
    crossAxisDimension = 'width';
    groupsGap = columnGap;
    itemsGap = rowGap;
    mainAxisContainerSize = containerDimensions.height;
    crossAxisContainerSize = containerDimensions.width;
  }

  const crossAxisGroupOffsets = alignFlexContent(
    alignContent,
    groupsGap,
    crossAxisGroupSizes,
    crossAxisContainerSize
  );

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const crossAxisGroupSize = crossAxisGroupSizes[i];
    const crossAxisGroupOffset = crossAxisGroupOffsets[i];

    if (
      !group ||
      crossAxisGroupSize === undefined ||
      crossAxisGroupOffset === undefined
    ) {
      return null;
    }

    const mainAxisItemsOffsets = justifyGroupItems(
      justifyContent,
      itemsGap,
      group.map(key => itemDimensions[key]?.[mainAxisDimension] ?? 0),
      mainAxisContainerSize
    );
    const crossAxisItemsOffsets = alignGroupItems(
      alignItems,
      group.map(key => itemDimensions[key]?.[crossAxisDimension] ?? 0),
      flexWrap === 'nowrap' ? crossAxisContainerSize : crossAxisGroupSize
    );

    for (let j = 0; j < group.length; j++) {
      const key = group[j];
      const mainAxisOffset = mainAxisItemsOffsets[j];
      const crossAxisOffset =
        crossAxisGroupOffset + (crossAxisItemsOffsets[j] ?? 0);

      if (key === undefined || mainAxisOffset === undefined) {
        return null;
      }

      positions[key] =
        groupBy === 'height'
          ? { x: crossAxisOffset, y: mainAxisOffset }
          : { x: mainAxisOffset, y: crossAxisOffset };
    }
  }

  return { crossAxisGroupOffsets, itemPositions: positions };
};
