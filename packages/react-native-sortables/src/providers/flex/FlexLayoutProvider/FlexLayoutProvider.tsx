import { type PropsWithChildren, useCallback } from 'react';
import { useAnimatedReaction, useDerivedValue } from 'react-native-reanimated';

import { type DEFAULT_SORTABLE_FLEX_PROPS, IS_WEB } from '../../../constants';
import { useDebugContext } from '../../../debug';
import type { RequiredBy } from '../../../helperTypes';
import { useMutableValue } from '../../../integrations/reanimated';
import type {
  DebugRectUpdater,
  DimensionLimits,
  FlexLayout,
  FlexLayoutContextType,
  Paddings,
  SortableFlexStyle
} from '../../../types';
import { haveEqualPropValues } from '../../../utils';
import {
  useAutoScrollContext,
  useCommonValuesContext,
  useMeasurementsContext
} from '../../shared';
import { createProvider } from '../../utils';
import { calculateLayout, updateLayoutDebugRects } from './utils';

export type FlexLayoutProviderProps = PropsWithChildren<
  RequiredBy<
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
    containerHeight,
    containerWidth,
    controlledContainerDimensions,
    indexToKey,
    itemHeights,
    itemPositions,
    itemWidths,
    shouldAnimateLayout
  } = useCommonValuesContext();
  const { applyControlledContainerDimensions } = useMeasurementsContext();
  const { contentBounds } = useAutoScrollContext() ?? {};
  const debugContext = useDebugContext();

  const keyToGroup = useMutableValue<Record<string, number>>({});

  const columnGap = useDerivedValue(() => columnGap_ ?? gap);
  const rowGap = useDerivedValue(() => rowGap_ ?? gap);

  const paddings = useDerivedValue<Paddings>(() => ({
    bottom: paddingBottom ?? paddingVertical ?? padding,
    left: paddingLeft ?? paddingHorizontal ?? padding,
    right: paddingRight ?? paddingHorizontal ?? padding,
    top: paddingTop ?? paddingVertical ?? padding
  }));

  const dimensionsLimits = useDerivedValue<DimensionLimits | null>(() => {
    const h = height === 'fill' ? undefined : height;
    const w = width === 'fill' ? undefined : width;

    let minH = Math.max(minHeight ?? 0, h ?? 0);
    let maxH = Math.min(maxHeight ?? Infinity, h ?? Infinity);
    let minW = Math.max(minWidth ?? 0, w ?? 0);
    let maxW = Math.min(maxWidth ?? Infinity, w ?? Infinity);

    if (!controlledContainerDimensions.width) {
      if (!containerWidth.value) {
        return null;
      }
      minW = maxW = containerWidth.value;
    }
    if (!controlledContainerDimensions.height) {
      if (!containerHeight.value) {
        return null;
      }
      minH = maxH = containerHeight.value;
    }

    return {
      maxHeight: maxH,
      maxWidth: maxW,
      minHeight: maxHeight ? Math.min(minH, maxH) : minH,
      minWidth: maxWidth ? Math.min(minW, maxW) : minW
    };
  });

  const appliedLayout = useMutableValue<FlexLayout | null>(null);
  let debugCrossAxisGapRects: Array<DebugRectUpdater> | undefined;
  let debugMainAxisGapRects: Array<DebugRectUpdater> | undefined;

  if (__DEV__) {
    // Because the number of groups can dynamically change after order change
    // and we can't detect that in the React runtime, we are creating debug
    // rects for the maximum number of groups that can be displayed (which
    // is the number of items minus 1 in the worst case for just a single group)
    const itemsCount = useItemsCount();
    debugCrossAxisGapRects = debugContext?.useDebugRects(itemsCount - 1);
    debugMainAxisGapRects = debugContext?.useDebugRects(itemsCount);
  }

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
      itemHeights: itemHeights.value,
      itemWidths: itemWidths.value,
      limits: dimensionsLimits.value,
      paddings: paddings.value
    }),
    (props, previousProps) => {
      const layout = calculateLayout(props);

      // On web, animate layout only if parent container is not resized
      // (e.g. skip animation when the browser window is resized)
      shouldAnimateLayout.value =
        !IS_WEB ||
        !previousProps?.limits ||
        haveEqualPropValues(props?.limits, previousProps?.limits);

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

      // Update content bounds
      if (contentBounds) contentBounds.value = layout.contentBounds;

      // DEBUG ONLY
      if (debugCrossAxisGapRects && debugMainAxisGapRects) {
        updateLayoutDebugRects(
          flexDirection,
          layout,
          debugCrossAxisGapRects,
          debugMainAxisGapRects,
          itemWidths.value,
          itemHeights.value
        );
      }
    }
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
        itemHeights: itemHeights.value,
        itemWidths: itemWidths.value,
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
      itemHeights,
      itemWidths,
      dimensionsLimits,
      paddings
    ]
  );

  return {
    value: {
      appliedLayout,
      calculateFlexLayout,
      columnGap,
      flexDirection,
      keyToGroup,
      rowGap
    }
  };
});

export { FlexLayoutProvider, useFlexLayoutContext };
