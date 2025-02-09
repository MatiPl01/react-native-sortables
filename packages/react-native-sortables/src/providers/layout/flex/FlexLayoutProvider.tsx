import { type PropsWithChildren, useCallback } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import {
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue
} from 'react-native-reanimated';

import { type DEFAULT_SORTABLE_FLEX_PROPS, IS_WEB } from '../../../constants';
import { useDebugContext } from '../../../debug';
import type {
  FlexLayout,
  FlexLayoutContextType,
  RequiredBy,
  SortableFlexStyle
} from '../../../types';
import { haveEqualPropValues } from '../../../utils';
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
    itemPositions,
    shouldAnimateLayout
  } = useCommonValuesContext();
  const debugContext = useDebugContext();

  const keyToGroup = useSharedValue<Record<string, number>>({});

  const columnGap = useDerivedValue(() => columnGap_ ?? gap);
  const rowGap = useDerivedValue(() => rowGap_ ?? gap);

  const paddings = useDerivedValue(() => ({
    bottom: paddingBottom ?? paddingVertical ?? padding,
    left: paddingLeft ?? paddingHorizontal ?? padding,
    right: paddingRight ?? paddingHorizontal ?? padding,
    top: paddingTop ?? paddingVertical ?? padding
  }));

  const dimensionsLimits = useDerivedValue(() => {
    const minH = Math.max(minHeight ?? 0, height ?? 0);
    const maxH = Math.max(maxHeight ?? 0, height ?? 0) || Infinity;

    return {
      maxHeight: maxH,
      minHeight: maxHeight ? Math.min(minH, maxH) : minH,
      width: containerWidth.value ?? 0
    };
  });

  const appliedLayout = useSharedValue<FlexLayout | null>(null);

  // Because the number of groups can dynamically change after order change
  // and we can't detect that in the React runtime, we are creating debug
  // rects for the maximum number of groups that can be displayed (which
  // is the number of items minus 1 in the worst case for just a single group)
  const debugCrossAxisGapRects = debugContext?.useDebugRects(itemsCount - 1);
  const debugMainAxisGapRects = debugContext?.useDebugRects(itemsCount);

  const useFlexLayoutReaction = useCallback(
    (
      idxToKey: SharedValue<Array<string> | null> | SharedValue<Array<string>>,
      onChange: (layout: FlexLayout | null, shouldAnimate: boolean) => void
    ) =>
      useAnimatedReaction(
        () =>
          idxToKey.value === null
            ? null
            : {
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
                paddings: paddings.value
              },
        (props, previousProps) => {
          onChange(
            props && calculateLayout(props),
            // Animate layout only if parent container is not resized
            // (e.g. skip animation when the browser window is resized)
            !!(
              IS_WEB &&
              props &&
              previousProps &&
              haveEqualPropValues(props.limits, previousProps.limits)
            )
          );
        }
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

  const calculateFlexLayout = useCallback(
    (idxToKey: Array<string>) => {
      'worklet';
      return calculateLayout({
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
        indexToKey: idxToKey,
        itemDimensions: itemDimensions.value,
        limits: dimensionsLimits.value,
        paddings: paddings.value
      });
    },
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

  useFlexLayoutReaction(indexToKey, (layout, shouldAnimate) => {
    'worklet';
    shouldAnimateLayout.value = shouldAnimate;
    if (!layout) {
      return;
    }

    // Update current layout
    appliedLayout.value = layout;
    // Update item positions
    itemPositions.value = layout.itemPositions;
    // Update container height
    const { maxHeight: max, minHeight: min } = dimensionsLimits.value;
    containerHeight.value = Math.min(Math.max(min, layout.totalHeight), max);
    // Update key to group
    keyToGroup.value = Object.fromEntries(
      layout.itemGroups.flatMap((group, i) => group.map(key => [key, i]))
    );

    // DEBUG ONLY
    if (debugCrossAxisGapRects && debugMainAxisGapRects) {
      updateLayoutDebugRects(
        flexDirection,
        layout,
        debugCrossAxisGapRects,
        debugMainAxisGapRects,
        itemDimensions
      );
    }
  });

  return {
    value: {
      appliedLayout,
      calculateFlexLayout,
      columnGap,
      flexDirection,
      keyToGroup,
      rowGap,
      useFlexLayoutReaction
    }
  };
});

export { FlexLayoutProvider, useFlexLayoutContext };
