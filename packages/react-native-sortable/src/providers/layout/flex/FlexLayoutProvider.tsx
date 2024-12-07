import type { PropsWithChildren } from 'react';
import { useMemo } from 'react';
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
import type { FlexDirection, FlexProps } from './types';
import { calculateLayout, calculateReferenceSize } from './utils';

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
  const keyToGroup = useSharedValue<Record<string, number>>(EMPTY_OBJECT);
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

      // Update item positions
      itemPositions.value = layout.itemPositions;

      // Update container height
      const referenceHeight = referenceContainerDimensions.value.height;
      if (isHeightLimited && referenceHeight !== undefined) {
        containerHeight.value = referenceHeight;
      } else {
        containerHeight.value = layout.totalHeight;
      }

      // Update overridden item dimensions (only for stretch)
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
            overriddenStyles[key] = {
              alignItems: 'stretch',
              flexDirection,
              [overriddenDimension]: groupSize
            };
          }
        }
        itemStyleOverrides.value = overriddenStyles;
      } else {
        itemStyleOverrides.value = EMPTY_OBJECT;
      }

      // TODO - add overridden item dimensions and debug rects
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
