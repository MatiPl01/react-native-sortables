import type { DimensionValue, ViewStyle } from 'react-native';

import { OFFSET_EPS } from '../../../constants';
import type { Dimension, Dimensions, Nullable, Vector } from '../../../types';
import { sum } from '../../../utils';

export const areDimensionsCorrect = (
  dimensions: Nullable<Dimensions>
): dimensions is Dimensions => {
  'worklet';
  return (
    dimensions.width !== null &&
    dimensions.width >= 0 &&
    dimensions.height !== null &&
    dimensions.height >= 0
  );
};

export const isDimensionRestricted = (dimension: DimensionValue): boolean => {
  'worklet';
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
  return !['auto', null, undefined].includes(dimension as any);
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

type AlignmentResult = {
  offsets: Array<number>;
  containerSize: number;
};

const alignHelper = (
  align: Required<ViewStyle['alignContent'] | ViewStyle['justifyContent']>,
  gapProp: number,
  sizes: Array<number>,
  containerSize: number
): AlignmentResult => {
  'worklet';
  let startOffset = 0;
  let adjustedGap = gapProp;

  const getTotalSize = (gap: number) => sum(sizes) + gap * (sizes.length - 1);

  let offsets: Array<number> = [];

  // If container size is -1, the container size should be adjusted automatically
  // to match the total size od the content. It is, in fact, the same as calculating
  // offsets for the flex-start alignment
  if (containerSize === -1) {
    align = 'flex-start';
    // resulting size of the container is the same as the total size og the content
    containerSize = getTotalSize(gapProp);
  }

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
      offsets = [0];
      for (let i = 0; i < sizes.length - 1; i++) {
        offsets.push(
          (offsets[i] ?? 0) + (sizes[i] ?? 0) * multiplier + gapProp
        );
      }
    }
  }

  if (!offsets.length) {
    offsets = [startOffset];
    for (let i = 0; i < sizes.length - 1; i++) {
      offsets.push((startOffset += (sizes[i] ?? 0) + adjustedGap));
    }
  }

  return { containerSize, offsets };
};

const alignFlexContent = (
  align: Required<ViewStyle['alignContent']>,
  gap: number,
  groupSizes: Array<number>,
  containerSize: number
): AlignmentResult => {
  'worklet';
  return alignHelper(align, gap, groupSizes, containerSize);
};

const justifyGroupItems = (
  justify: Required<ViewStyle['justifyContent']>,
  gap: number,
  groupItemSizes: Array<number>,
  containerSize: number
): AlignmentResult => {
  'worklet';
  return alignHelper(justify, gap, groupItemSizes, containerSize);
};

const alignGroupItems = (
  align: Required<ViewStyle['alignItems']>,
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
  restrictedDimensions: Dimensions,
  {
    alignContent,
    alignItems,
    columnGap,
    flexWrap,
    justifyContent,
    rowGap
  }: Required<
    Pick<
      ViewStyle,
      | 'alignContent'
      | 'alignItems'
      | 'columnGap'
      | 'flexWrap'
      | 'justifyContent'
      | 'rowGap'
    >
  >
): {
  crossAxisGroupOffsets: Array<number>;
  itemPositions: Record<string, Vector>;
  containerHeight: number;
  containerWidth: number;
} | null => {
  'worklet';
  const positions: Record<string, Vector> = {};

  const mainAxisDimension = groupBy;
  let crossAxisDimension: Dimension = 'height';
  let groupsGap: number = rowGap;
  let itemsGap: number = columnGap;
  let mainAxisSizeLimit: number = restrictedDimensions.width;
  let crossAxisSizeLimit: number = restrictedDimensions.height;

  let mainAxisContainerSize = 0;

  if (groupBy === 'height') {
    crossAxisDimension = 'width';
    groupsGap = columnGap;
    itemsGap = rowGap;
    mainAxisSizeLimit = restrictedDimensions.height;
    crossAxisSizeLimit = restrictedDimensions.width;
  }

  const {
    containerSize: crossAxisContainerSize,
    offsets: crossAxisGroupOffsets
  } = alignFlexContent(
    alignContent,
    groupsGap,
    crossAxisGroupSizes,
    crossAxisSizeLimit
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

    const { containerSize: mainAxisGroupSize, offsets: mainAxisItemsOffsets } =
      justifyGroupItems(
        justifyContent,
        itemsGap,
        group.map(key => itemDimensions[key]?.[mainAxisDimension] ?? 0),
        mainAxisSizeLimit
      );
    if (mainAxisGroupSize > mainAxisContainerSize) {
      mainAxisContainerSize = mainAxisGroupSize;
    }
    const crossAxisItemsOffsets = alignGroupItems(
      alignItems,
      group.map(key => itemDimensions[key]?.[crossAxisDimension] ?? 0),
      flexWrap === 'nowrap' ? crossAxisSizeLimit : crossAxisGroupSize
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

  return {
    containerHeight:
      mainAxisDimension === 'height'
        ? mainAxisContainerSize
        : crossAxisContainerSize,
    containerWidth:
      mainAxisDimension === 'width'
        ? mainAxisContainerSize
        : crossAxisContainerSize,
    crossAxisGroupOffsets,
    itemPositions: positions
  };
};
