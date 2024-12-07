/* eslint-disable import/no-unused-modules */
import type { Dimension, Dimensions, Vector } from '../../../../types';
import { reverseArray, sum } from '../../../../utils';
import type {
  AlignContent,
  FlexAlignments,
  FlexDirection,
  FlexLayout,
  FlexLayoutProps,
  JustifyContent
} from '../types';
import { areDimensionsCorrect } from './helpers';

const createGroups = (
  indexToKey: Array<string>,
  itemDimensions: Record<string, Dimensions>,
  mainDimension: Dimension,
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
    const itemDimension = itemDimensions[key]?.[mainDimension];
    if (itemDimension === undefined) {
      return null;
    }

    if (
      totalGroupItemsMainSize + currentGroup.length * gap + itemDimension >
      groupMainSizeLimit
    ) {
      groups.push(currentGroup);
      crossAxisGroupSizes.push(groupCrossSize);
      currentGroup = [];
      totalGroupItemsMainSize = 0;
      groupCrossSize = 0;
    }

    currentGroup.push(key);
    totalGroupItemsMainSize += itemDimension;
    if (itemDimension > groupCrossSize) {
      groupCrossSize = itemDimension;
    }
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
    crossAxisGroupSizes.push(groupCrossSize);
  }

  return { crossAxisGroupSizes, groups };
};

const calculateContentAlignment = (
  align: AlignContent | JustifyContent,
  sizes: Array<number>,
  providedGap: number,
  containerSize: number
): {
  offsets: Array<number>;
  minTotalSize: number;
} => {
  'worklet';
  let startOffset = 0;
  let adjustedGap = providedGap;

  const getTotalSize = (gap: number) => sum(sizes) + gap * (sizes.length - 1);
  const minTotalSize = getTotalSize(providedGap);
  const adjustedContainerSize = Math.max(minTotalSize, containerSize);

  switch (align) {
    case 'flex-end':
      startOffset = adjustedContainerSize - minTotalSize;
      break;
    case 'center':
      startOffset = (adjustedContainerSize - minTotalSize) / 2;
      break;
    case 'stretch': {
      if (minTotalSize === 0) break;
      const multiplier = adjustedContainerSize / minTotalSize;
      const offsets = [0];
      for (let i = 0; i < sizes.length - 1; i++) {
        offsets.push(
          (offsets[i] ?? 0) + (sizes[i] ?? 0) * multiplier + providedGap
        );
      }
      return { minTotalSize, offsets };
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

  return { minTotalSize, offsets };
};

// const withJustifyContent = (justifyContent: JustifyContent) => {
//   'worklet';
// };

// const withAlignItems = (alignItems: AlignItems) => {
//   'worklet';
// };

// const withJustifyItems = (justifyItems: JustifyItems) => {
//   'worklet';
// };

const handleLayoutCalculation = (
  groups: Array<Array<string>>,
  crossAxisGroupSizes: Array<number>,
  itemDimensions: Record<string, Dimensions>,
  gaps: FlexLayoutProps['gaps'],
  mainDirection: 'column' | 'row',
  mainDimension: Dimension,
  { alignContent }: FlexAlignments,
  providedContainerDimensions?: Dimensions
): {
  itemPositions: Record<string, Vector>;
  crossAxisGroupOffsets: Array<number>;
  minContainerHeight: number;
} => {
  'worklet';
  const isRow = mainDirection === 'row';
  const crossDimension = isRow ? 'height' : 'width';
  const crossDirection = isRow ? 'column' : 'row';

  const {
    minTotalSize: minContainerCrossSize,
    offsets: crossAxisGroupOffsets
  } = calculateContentAlignment(
    alignContent,
    crossAxisGroupSizes,
    gaps[crossDirection],
    providedContainerDimensions?.[crossDimension] ?? 0
  );

  const minContainerHeight = isRow ? minContainerCrossSize : 0; // TODO: calculate minContainerMainSize

  return {
    crossAxisGroupOffsets,
    minContainerHeight
  };
};

export const calculateLayout = ({
  flexAlignments,
  flexDirection,
  flexWrap,
  gaps,
  indexToKey,
  itemDimensions,
  providedContainerDimensions
}: FlexLayoutProps): FlexLayout | null => {
  'worklet';
  if (
    providedContainerDimensions &&
    !areDimensionsCorrect(providedContainerDimensions)
  ) {
    return null;
  }

  // Determine the direction of the main axis and the parallel dimension
  let mainDirection: FlexDirection = 'row';
  let mainDimension: Dimension = 'width';

  if (flexDirection.startsWith('column')) {
    mainDirection = 'column';
    mainDimension = 'height';
  }

  const groupSizeLimit =
    flexWrap === 'nowrap'
      ? Infinity
      : (providedContainerDimensions?.[mainDimension] ??
        measuredContainerDimensions[mainDimension]);
  const groupingResult = createGroups(
    indexToKey,
    itemDimensions,
    mainDimension,
    gaps[mainDirection],
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

  const layoutResult = handleLayoutCalculation(
    groups,
    crossAxisGroupSizes,
    itemDimensions,
    gaps,
    mainDirection,
    mainDimension,
    flexAlignments,
    containerDimensions
  );
  if (!layoutResult) {
    return null;
  }

  return {
    containerHeight: containerDimensions.height,
    crossAxisGroupOffsets: layoutResult.crossAxisGroupOffsets,
    itemGroups: groups,
    itemPositions: layoutResult.itemPositions
  };
};
