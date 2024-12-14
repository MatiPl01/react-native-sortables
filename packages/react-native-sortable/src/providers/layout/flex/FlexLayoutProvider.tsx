import { type PropsWithChildren, useCallback, useMemo } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import {
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue
} from 'react-native-reanimated';

import type { DEFAULT_SORTABLE_FLEX_PROPS } from '../../../constants';
import { useDebugContext } from '../../../debug';
import type {
  FlexLayoutContextType,
  RequiredBy,
  SortableFlexStyle
} from '../../../types';
import { useCommonValuesContext } from '../../shared';
import { createProvider } from '../../utils';
import { calculateLayout, updateLayoutDebugRects } from './utils';

type FlexLayoutProviderProps = PropsWithChildren<
  {
    itemsCount: number;
  } & RequiredBy<
    SortableFlexStyle,
    keyof SortableFlexStyle & keyof typeof DEFAULT_SORTABLE_FLEX_PROPS
  >
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
  minHeight,
  padding,
  paddingBottom,
  paddingHorizontal,
  paddingLeft,
  paddingRight,
  paddingTop,
  paddingVertical,
  rowGap: rowGap_
}) => {
  const {
    containerHeight,
    containerWidth,
    indexToKey,
    itemDimensions,
    itemPositions
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

  const columnGap = useDerivedValue(() => columnGap_ ?? gap);
  const rowGap = useDerivedValue(() => rowGap_ ?? gap);
  const adjustedCrossGap = useSharedValue<number>(0);

  const paddings = useMemo(
    () => ({
      bottom: paddingBottom ?? paddingVertical ?? padding,
      left: paddingLeft ?? paddingHorizontal ?? padding,
      right: paddingRight ?? paddingHorizontal ?? padding,
      top: paddingTop ?? paddingVertical ?? padding
    }),
    [
      paddingTop,
      paddingBottom,
      paddingLeft,
      paddingRight,
      paddingVertical,
      paddingHorizontal,
      padding
    ]
  );

  const dimensionsLimits = useDerivedValue(() => {
    const minH = Math.max(minHeight ?? 0, height ?? 0);
    const maxH = Math.max(maxHeight ?? 0, height ?? 0) || Infinity;

    return {
      maxHeight: maxH,
      minHeight: maxHeight ? Math.min(minH, maxH) : minH,
      width: containerWidth.value
    };
  });

  // Because the number of groups can dynamically change after order change
  // and we can't detect that in the React runtime, we are creating debug
  // rects for the maximum number of groups that can be displayed (which
  // is the number of items minus 1 in the worst case for just a single group)
  const debugCrossAxisGapRects = debugContext?.useDebugRects(itemsCount - 1);
  const debugMainAxisGapRects = debugContext?.useDebugRects(itemsCount);

  const useFlexLayout = useCallback(
    (idxToKey: SharedValue<Array<string>>) =>
      useDerivedValue(() =>
        calculateLayout({
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
          indexToKey: idxToKey.value,
          itemDimensions: itemDimensions.value,
          limits: dimensionsLimits.value,
          paddings
        })
      ),
    [
      alignContent,
      alignItems,
      justifyContent,
      flexDirection,
      flexWrap,
      columnGap,
      rowGap,
      itemDimensions,
      dimensionsLimits,
      paddings
    ]
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
      limits: dimensionsLimits.value,
      paddings
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
      // Update adjusted cross gap
      adjustedCrossGap.value = layout.adjustedCrossGap;
      // Update container height
      const { maxHeight: max, minHeight: min } = dimensionsLimits.value;
      containerHeight.value = Math.min(Math.max(min, layout.totalHeight), max);

      // DEBUG ONLY
      if (debugCrossAxisGapRects && debugMainAxisGapRects) {
        updateLayoutDebugRects(
          layout,
          debugCrossAxisGapRects,
          debugMainAxisGapRects,
          itemDimensions
        );
      }
    }
  );

  return {
    value: {
      adjustedCrossGap,
      columnGap,
      crossAxisGroupOffsets,
      crossAxisGroupSizes,
      dimensionsLimits,
      flexDirection,
      itemGroups,
      keyToGroup,
      rowGap,
      useFlexLayout
    }
  };
});

export { FlexLayoutProvider, useFlexLayoutContext };
