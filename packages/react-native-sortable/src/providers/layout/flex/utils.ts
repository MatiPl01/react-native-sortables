import type {
  DebugComponentType,
  DebugComponentUpdater
} from '../../../debug/types';
import type { Dimension, Dimensions, Vector } from '../../../types';
import { sum, zipArrays } from '../../../utils';
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

  const getCurrentGap = () => (currentGroup.length > 0 ? itemsGap : 0);

  for (const key of indexToKey) {
    const itemDimensions = dimensions[key];
    if (!itemDimensions) {
      return null;
    }
    const itemDimension = itemDimensions[limitedDimension];
    if (currentDimension + itemDimension + getCurrentGap() > limit) {
      groups.push(currentGroup);
      currentGroup = [];
      currentDimension = 0;
    }

    currentGroup.push(key);
    currentDimension += itemDimension + getCurrentGap();
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

  for (let i = 0; i < sizes.length; i++) {
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
  itemPositions: Record<string, Vector>;
} | null => {
  'worklet';
  const positions: Record<string, Vector> = {};

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

const DEBUG_COLORS = {
  backgroundColor: '#ffa500',
  borderColor: '#825500'
};

export const updateDebugMainAxisGapRects = (
  rects: Array<DebugComponentUpdater<DebugComponentType.Rect>>,
  groupBy: Dimension,
  keyToGroup: Record<string, number>,
  itemPositions: Record<string, Vector>,
  crossAxisGroupSizes: Array<number>,
  crossAxisGroupOffsets: Array<number>,
  gaps: { rowGap: number; columnGap: number }
) => {
  'worklet';

  if (groupBy === 'width') {
    zipArrays(rects, Object.entries(keyToGroup)).forEach(
      ([rect, [key, groupIndex]]) => {
        const y1 = crossAxisGroupOffsets[groupIndex] ?? 0;
        const y2 = y1 + (crossAxisGroupSizes[groupIndex] ?? 0);
        const x1 = itemPositions[key]?.x ?? 0;

        if (x1 <= 0) {
          rect.hide();
        } else {
          rect.set({
            ...DEBUG_COLORS,
            from: { x: x1 - gaps.columnGap, y: y1 },
            to: { x: x1, y: y2 }
          });
        }
      }
    );
  } else {
    zipArrays(rects, Object.entries(keyToGroup)).forEach(
      ([rect, [key, groupIndex]]) => {
        const x1 = crossAxisGroupOffsets[groupIndex] ?? 0;
        const x2 = x1 + (crossAxisGroupSizes[groupIndex] ?? 0);
        const y1 = itemPositions[key]?.y ?? 0;

        if (y1 <= 0) {
          rect.hide();
        } else {
          rect.set({
            ...DEBUG_COLORS,
            from: { x: x1, y: y1 - gaps.rowGap },
            to: { x: x2, y: y1 }
          });
        }
      }
    );
  }
};

export const updateDebugCrossAxisGapRects = (
  rects: Array<DebugComponentUpdater<DebugComponentType.Rect>>,
  groupBy: Dimension,
  crossAxisGroupOffsets: Array<number>,
  gaps: { rowGap: number; columnGap: number }
) => {
  'worklet';
  if (groupBy === 'height') {
    zipArrays(rects, crossAxisGroupOffsets).forEach(([rect, offset], index) => {
      if (offset > 0 && index < crossAxisGroupOffsets.length - 1) {
        rect.set({
          ...DEBUG_COLORS,
          positionOrigin: 'right',
          width: gaps.columnGap,
          x: offset
        });
      }
    });
  } else {
    zipArrays(rects, crossAxisGroupOffsets).forEach(([rect, offset], index) => {
      if (offset > 0 && index < crossAxisGroupOffsets.length - 1) {
        rect.set({
          ...DEBUG_COLORS,
          height: gaps.rowGap,
          positionOrigin: 'bottom',
          y: offset
        });
      }
    });
  }
  rects.slice(crossAxisGroupOffsets.length).forEach(rect => rect.hide());
};
