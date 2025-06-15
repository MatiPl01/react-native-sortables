import { type PropsWithChildren, useCallback } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import {
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue
} from 'react-native-reanimated';

import { type DEFAULT_SORTABLE_FLEX_PROPS, IS_WEB } from '../../../constants';
import { useDebugContext } from '../../../debug';
import {
  type FlexLayout,
  type FlexLayoutContextType,
  type RequiredBy,
  type SortableFlexStyle
} from '../../../types';
import { haveEqualPropValues } from '../../../utils';
import { useCommonValuesContext, useMeasurementsContext } from '../../shared';
import { createProvider } from '../../utils';
import { calculateLayout, updateLayoutDebugRects } from './utils';

type FlexLayoutProviderProps = PropsWithChildren<
  RequiredBy<
    SortableFlexStyle,
    keyof SortableFlexStyle & keyof typeof DEFAULT_SORTABLE_FLEX_PROPS
  > & {
    itemsCount: number;
  }
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
  padding,
  paddingBottom,
  paddingHorizontal,
  paddingLeft,
  paddingRight,
  paddingTop,
  paddingVertical,
  rowGap: rowGap_,
  width
}) => {
  const {
    controlledContainerDimensions,
    indexToKey,
    itemDimensions,
    itemPositions,
    measuredContainerHeight,
    measuredContainerWidth,
    shouldAnimateLayout
  } = useCommonValuesContext();
  const { applyControlledContainerDimensions } = useMeasurementsContext();
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
    if (
      measuredContainerHeight.value === null ||
      measuredContainerWidth.value === null
    ) {
      return null;
    }

    const h = height === 'fill' ? undefined : height;
    const w = width === 'fill' ? undefined : width;

    let minH = Math.max(minHeight ?? 0, h ?? 0);
    let maxH = Math.min(maxHeight ?? Infinity, h ?? Infinity);
    let minW = Math.max(minWidth ?? 0, w ?? 0);
    let maxW = Math.min(maxWidth ?? Infinity, w ?? Infinity);

    if (!controlledContainerDimensions.value.width) {
      minW = maxW = measuredContainerWidth.value;
    }
    if (!controlledContainerDimensions.value.height) {
      minH = maxH = measuredContainerHeight.value;
    }

    return {
      maxHeight: maxH,
      maxWidth: maxW,
      minHeight: maxHeight ? Math.min(minH, maxH) : minH,
      minWidth: maxWidth ? Math.min(minW, maxW) : minW
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
      idxToKey: SharedValue<Array<string>> | SharedValue<Array<string> | null>,
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
            // On web, animate layout only if parent container is not resized
            // (e.g. skip animation when the browser window is resized)
            !IS_WEB ||
              !previousProps?.limits ||
              haveEqualPropValues(props?.limits, previousProps?.limits)
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
    // Update controlled container dimensions
    applyControlledContainerDimensions(layout.totalDimensions);
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
