import type { PropsWithChildren } from 'react';
import { useCallback, useMemo } from 'react';
import type { ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import {
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue
} from 'react-native-reanimated';

import { useDebugContext } from '../../../debug';
import type { Dimensions } from '../../../types';
import { resolveDimensionValue } from '../../../utils';
import { useCommonValuesContext } from '../../shared';
import { createProvider } from '../../utils';
import type { FlexDirection, FlexLayout, FlexProps } from './types';
import {
  calculateLayout,
  calculateReferenceSize,
  updateLayoutDebugRects
} from './utils';

const EMPTY_OBJECT = {};

type FlexLayoutContextType = {
  flexDirection: FlexDirection;
  itemGroups: SharedValue<Array<Array<string>>>;
  keyToGroup: SharedValue<Record<string, number>>;
  crossAxisGroupSizes: SharedValue<Array<number>>;
  crossAxisGroupOffsets: SharedValue<Array<number>>;
  rowGap: SharedValue<number>;
  columnGap: SharedValue<number>;
};

type FlexLayoutProviderProps = PropsWithChildren<
  { itemsCount: number } & FlexProps
>;

const { FlexLayoutProvider, useFlexLayoutContext } = createProvider(
  'FlexLayout'
)<FlexLayoutProviderProps, FlexLayoutContextType>(({
  alignContent,
  alignItems,
  columnGap: columnGap_,
  flexDirection,
  flexWrap,
  gap,
  height,
  itemsCount,
  justifyContent,
  maxHeight,
  maxWidth,
  minHeight,
  minWidth,
  rowGap: rowGap_,
  width
}) => {
  const stretch = alignItems === 'stretch';
  const isRow = flexDirection.includes('row');

  const {
    containerHeight,
    containerWidth,
    indexToKey,
    itemDimensions,
    itemPositions,
    itemStyleOverrides,
    parentDimensions
  } = useCommonValuesContext();
  const debugContext = useDebugContext();

  const itemGroups = useSharedValue<Array<Array<string>>>([]);
  const keyToGroup = useDerivedValue<Record<string, number>>(() =>
    Object.fromEntries(
      itemGroups.value.flatMap((group, i) => group.map(key => [key, i]))
    )
  );
  const crossAxisGroupSizes = useSharedValue<Array<number>>([]);
  const crossAxisGroupOffsets = useSharedValue<Array<number>>([]);
  const referenceContainerDimensions =
    useSharedValue<Partial<Dimensions>>(EMPTY_OBJECT);

  const columnGap = useDerivedValue(
    () =>
      resolveDimensionValue(
        columnGap_ ?? gap,
        parentDimensions.value?.width ?? 0
      ) ?? 0
  );
  const rowGap = useDerivedValue(
    () =>
      resolveDimensionValue(
        rowGap_ ?? gap,
        parentDimensions.value?.height ?? 0
      ) ?? 0
  );

  const isHeightLimited = useMemo(
    () =>
      resolveDimensionValue(height, 0) !== undefined ||
      resolveDimensionValue(maxHeight, 0) !== undefined,
    [height, maxHeight]
  );

  // Because the number of groups can dynamically change after order change
  // and we can't detect that in the React runtime, we are creating debug
  // rects for the maximum number of groups that can be displayed (which
  // is the number of items minus 1 in the worst case for just a single group)
  const debugCrossAxisGapRects = debugContext?.useDebugRects(itemsCount - 1);
  const debugMainAxisGapRects = debugContext?.useDebugRects(itemsCount);

  const updateItemStyleOverrides = useCallback(
    (layout: FlexLayout) => {
      'worklet';

      if (stretch) {
        const overriddenStyles: Record<string, ViewStyle> = {};
        const overriddenDimension = isRow ? 'minHeight' : 'minWidth';

        for (let i = 0; i < layout.itemGroups.length; i++) {
          const group = layout.itemGroups[i];
          const groupSize = layout.crossAxisGroupSizes[i];

          if (!group || groupSize === undefined) {
            return;
          }

          for (const key of group) {
            const currentOverride = itemStyleOverrides.value[key];
            if (groupSize !== currentOverride?.[overriddenDimension]) {
              overriddenStyles[key] = {
                alignItems: 'stretch',
                flexDirection,
                [overriddenDimension]: groupSize
              };
            } else {
              overriddenStyles[key] = currentOverride;
            }
          }
        }
        itemStyleOverrides.value = overriddenStyles;
      } else {
        itemStyleOverrides.value = EMPTY_OBJECT;
      }
    },
    [flexDirection, isRow, itemStyleOverrides, stretch]
  );

  // REFERENCE CONTAINER DIMENSIONS UPDATER
  useAnimatedReaction(
    () => ({
      measuredWidth: containerWidth.value,
      parent: parentDimensions.value
    }),
    ({ measuredWidth, parent }) => {
      if (!parent || !measuredWidth) {
        referenceContainerDimensions.value = EMPTY_OBJECT;
        return;
      }

      const { height: parentH, width: parentW } = parent;
      const h = calculateReferenceSize(minHeight, height, maxHeight, parentH);
      const w = calculateReferenceSize(minWidth, width, maxWidth, parentW);

      const current = referenceContainerDimensions.value;
      if (h === current.height || w === current.width) {
        referenceContainerDimensions.value = {
          height: h,
          width: w ?? measuredWidth
        };
      }
    },
    [minHeight, minWidth, height, width, maxHeight, maxWidth]
  );

  // FLEX LAYOUT UPDATER
  useAnimatedReaction(
    () => ({
      flexAlignments: {
        alignContent,
        alignItems,
        justifyContent
      },
      flexDirection,
      flexWrap,
      gaps: {
        column: columnGap.value,
        row: rowGap.value
      },
      indexToKey: indexToKey.value,
      itemDimensions: itemDimensions.value,
      referenceContainerDimensions: referenceContainerDimensions.value
    }),
    props => {
      const layout = calculateLayout(props);
      if (!layout) {
        return;
      }

      // Update item groups
      itemGroups.value = layout.itemGroups;
      // Update item positions
      itemPositions.value = layout.itemPositions;
      // Update cross axis group offsets and sizes
      crossAxisGroupOffsets.value = layout.crossAxisGroupOffsets;
      crossAxisGroupSizes.value = layout.crossAxisGroupSizes;
      // Update container height
      const referenceHeight = referenceContainerDimensions.value.height;
      if (isHeightLimited && referenceHeight !== undefined) {
        containerHeight.value = referenceHeight;
      } else {
        containerHeight.value = layout.totalHeight;
      }
      // Update style overrides
      updateItemStyleOverrides(layout);

      // DEBUG ONLY
      if (debugCrossAxisGapRects && debugMainAxisGapRects) {
        updateLayoutDebugRects(
          layout,
          debugCrossAxisGapRects,
          debugMainAxisGapRects,
          itemDimensions
        );
      }
    },
    [alignContent, alignItems, justifyContent, flexDirection, flexWrap]
  );

  return {
    value: {
      columnGap,
      crossAxisGroupOffsets,
      crossAxisGroupSizes,
      flexDirection,
      itemGroups,
      keyToGroup,
      rowGap
    }
  };
});

export { FlexLayoutProvider, useFlexLayoutContext };
