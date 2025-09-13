import { type PropsWithChildren, useCallback, useRef } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import { useAnimatedReaction } from 'react-native-reanimated';

import { IS_WEB } from '../../../constants';
import { useDebugContext } from '../../../debug';
import {
  setAnimatedTimeout,
  useMutableValue
} from '../../../integrations/reanimated';
import type {
  DebugRectUpdater,
  GridLayoutContextType,
  GridLayoutProps
} from '../../../types';
import {
  useAutoScrollContext,
  useCommonValuesContext,
  useItemsCount,
  useMeasurementsContext
} from '../../shared';
import { createProvider } from '../../utils';
import { useAutoOffsetAdjustmentContext } from '../AutoOffsetAdjustmentProvider';
import { calculateLayout, shouldUpdateContainerDimensions } from './utils';

type UpdateShouldAnimateWeb = (
  props: GridLayoutProps,
  prevProps: GridLayoutProps | null
) => void;

const DEBUG_COLORS = {
  backgroundColor: '#ffa500',
  borderColor: '#825500'
};

export type GridLayoutProviderProps = PropsWithChildren<{
  numGroups: number;
  isVertical: boolean;
  rowGap: SharedValue<number>;
  columnGap: SharedValue<number>;
  rowHeight?: number;
}>;

const { GridLayoutProvider, useGridLayoutContext } = createProvider(
  'GridLayout'
)<GridLayoutProviderProps, GridLayoutContextType>(({
  columnGap,
  isVertical,
  numGroups,
  rowGap,
  rowHeight
}) => {
  const {
    containerHeight,
    containerWidth,
    indexToKey,
    itemHeights,
    itemPositions,
    itemWidths,
    shouldAnimateLayout
  } = useCommonValuesContext();
  const { applyControlledContainerDimensions } = useMeasurementsContext();
  const { adaptLayoutProps } = useAutoOffsetAdjustmentContext() ?? {};
  const { contentBounds } = useAutoScrollContext() ?? {};
  const debugContext = useDebugContext();

  let debugCrossGapRects: Array<DebugRectUpdater> | undefined;
  let debugMainGapRects: Array<DebugRectUpdater> | undefined;

  if (__DEV__) {
    const itemsCount = useItemsCount();
    debugMainGapRects = debugContext?.useDebugRects(numGroups - 1);
    debugCrossGapRects = debugContext?.useDebugRects(
      Math.ceil(itemsCount / numGroups) - 1
    );
  }

  const mainGap = isVertical ? columnGap : rowGap;
  const crossGap = isVertical ? rowGap : columnGap;

  const mainGroupSize = useMutableValue<null | number>(null);
  const layoutRequestId = useMutableValue(0);

  let updateShouldAnimateWeb: null | UpdateShouldAnimateWeb = null;

  if (IS_WEB) {
    const shouldAnimateTimeoutRef = useRef<null | ReturnType<
      typeof setTimeout
    >>(null);

    updateShouldAnimateWeb = useCallback<UpdateShouldAnimateWeb>(
      (props, prevProps) => {
        // On the web, animate layout only if parent container is not resized
        // (e.g. skip animation when the browser window is resized)
        const shouldAnimate =
          !prevProps?.itemHeights ||
          !prevProps?.itemWidths ||
          (isVertical
            ? props.itemWidths === prevProps?.itemWidths
            : props.itemHeights === prevProps?.itemHeights);

        if (shouldAnimateTimeoutRef.current !== null) {
          clearTimeout(shouldAnimateTimeoutRef.current);
        }
        if (!shouldAnimate) {
          shouldAnimateLayout.value = false;
        }
        // Enable after timeout when the user stops resizing the browser window
        shouldAnimateTimeoutRef.current = setTimeout(() => {
          shouldAnimateLayout.value = true;
        }, 100);
      },
      [shouldAnimateLayout, isVertical]
    );
  }

  // MAIN GROUP SIZE UPDATER
  useAnimatedReaction(
    () => {
      if (!isVertical) {
        // TODO - maybe don't require specifying rowHeight (and instead
        // occupy the entire height of the container)
        return rowHeight ?? null;
      }

      return containerWidth.value
        ? (containerWidth.value + mainGap.value) / numGroups - mainGap.value
        : null;
    },
    value => {
      if (!value) {
        return;
      }

      if (isVertical) {
        itemWidths.value = value;
      } else {
        itemHeights.value = value;
      }
      mainGroupSize.value = value;

      // DEBUG ONLY
      if (debugMainGapRects) {
        const gap = mainGap.value;

        for (let i = 0; i < numGroups - 1; i++) {
          const pos = value * (i + 1) + gap * i;

          debugMainGapRects[i]?.set({
            ...DEBUG_COLORS,
            ...(isVertical ? { width: gap, x: pos } : { height: gap, y: pos })
          });
        }
      }
    }
  );

  // GRID LAYOUT UPDATER
  useAnimatedReaction(
    () => ({
      gaps: {
        cross: crossGap.value,
        main: mainGap.value
      },
      indexToKey: indexToKey.value,
      isVertical,
      itemHeights: itemHeights.value,
      itemWidths: itemWidths.value,
      numGroups,
      requestId: layoutRequestId.value // Helper to force layout re-calculation
    }),
    (props, prevProps) => {
      const adaptedProps: GridLayoutProps =
        adaptLayoutProps?.(props, prevProps) ?? props;
      const layout = calculateLayout(adaptedProps);
      if (!layout) {
        return;
      }

      // Update item positions
      itemPositions.value = layout.itemPositions;

      // Update controlled container dimensions
      if (
        shouldUpdateContainerDimensions(
          isVertical ? containerHeight.value : containerWidth.value,
          layout.containerCrossSize,
          adaptedProps.startCrossOffset !== undefined
        )
      ) {
        applyControlledContainerDimensions({
          [isVertical ? 'height' : 'width']: layout.containerCrossSize
        });
      }

      // Update content bounds
      if (contentBounds) contentBounds.value = layout.contentBounds;

      if (adaptedProps.shouldAnimateLayout !== undefined) {
        shouldAnimateLayout.value = adaptedProps.shouldAnimateLayout;
      } else if (IS_WEB && props.requestId === prevProps?.requestId) {
        updateShouldAnimateWeb?.(adaptedProps, prevProps);
      } else {
        shouldAnimateLayout.value = true;
      }

      if (adaptedProps.requestNextLayout) {
        setAnimatedTimeout(() => {
          layoutRequestId.value++;
        });
      }

      // DEBUG ONLY
      if (debugCrossGapRects) {
        for (let i = 0; i < layout.crossAxisOffsets.length - 1; i++) {
          const size = crossGap.value;
          const pos = layout.crossAxisOffsets[i + 1]! - crossGap.value;

          debugCrossGapRects[i]?.set({
            ...DEBUG_COLORS,
            ...(isVertical ? { height: size, y: pos } : { width: size, x: pos })
          });
        }
      }
    }
  );

  return {
    value: {
      crossGap,
      isVertical,
      mainGap,
      mainGroupSize,
      numGroups
    }
  };
});

export { GridLayoutProvider, useGridLayoutContext };
