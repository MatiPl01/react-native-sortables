import type { PropsWithChildren } from 'react';
import { useCallback } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import {
  clamp,
  Extrapolation,
  interpolate,
  measure,
  useAnimatedReaction,
  useDerivedValue,
  useScrollViewOffset
} from 'react-native-reanimated';

import {
  clearAnimatedTimeout,
  setAnimatedTimeout,
  useMutableValue
} from '../../integrations/reanimated';
import type {
  AutoOffsetAdjustmentContextType,
  Coordinate,
  ItemSizes
} from '../../types';
import {
  areValuesDifferent,
  calculateSnapOffset,
  resolveDimension,
  toPair
} from '../../utils';
import {
  useAutoScrollContext,
  useCommonValuesContext,
  useCustomHandleContext
} from '../shared';
import { createProvider } from '../utils';
import { calculateActiveItemCrossOffset } from './GridLayoutProvider/utils';

const SORT_ENABLED_RESTORE_TIMEOUT = 300;

type StateContext = {
  offsetInterpolationBounds?: [number, number];
  prevSortEnabled?: boolean;
  restoreSortEnabledTimeoutId?: number;
};

type AutoOffsetAdjustmentProviderProps = PropsWithChildren<{
  isVertical: boolean;
  columnGap: SharedValue<number>;
  rowGap: SharedValue<number>;
  numGroups: number;
  autoAdjustOffsetScrollPadding: [number, number] | number;
}>;

const { AutoOffsetAdjustmentProvider, useAutoOffsetAdjustmentContext } =
  createProvider('AutoOffsetAdjustment', {
    guarded: false
  })<AutoOffsetAdjustmentProviderProps, AutoOffsetAdjustmentContextType>(({
    autoAdjustOffsetScrollPadding,
    children,
    columnGap,
    isVertical,
    numGroups,
    rowGap
  }) => {
    const {
      activeItemDimensions,
      activeItemKey,
      activeItemPosition,
      enableActiveItemSnap,
      indexToKey,
      itemHeights,
      itemPositions,
      itemWidths,
      keyToIndex,
      snapOffsetX,
      snapOffsetY,
      sortEnabled,
      touchPosition
    } = useCommonValuesContext();
    const { activeHandleMeasurements, activeHandleOffset } =
      useCustomHandleContext() ?? {};
    const hasAutoScroll = !!useAutoScrollContext();

    const layoutUpdateProgress = useMutableValue<null | number>(null);

    const context = useMutableValue<StateContext>({});

    let crossCoordinate, crossGap, crossItemSizes;
    if (isVertical) {
      crossGap = rowGap;
      crossItemSizes = itemHeights;
      crossCoordinate = 'y' as const;
    } else {
      crossGap = columnGap;
      crossItemSizes = itemWidths;
      crossCoordinate = 'x' as const;
    }

    const getRemainingProps = useCallback(() => {
      'worklet';
      const key = activeItemKey.value;
      if (key === null) {
        return null;
      }

      let snapBasedOffset = 0;

      if (
        enableActiveItemSnap.value &&
        touchPosition.value &&
        activeItemPosition.value &&
        activeItemDimensions.value
      ) {
        const offset = calculateSnapOffset(
          snapOffsetX.value,
          snapOffsetY.value,
          activeHandleMeasurements?.value ?? activeItemDimensions.value,
          activeHandleOffset?.value
        );
        snapBasedOffset = isVertical
          ? touchPosition.value.y - activeItemPosition.value.y - offset.y
          : touchPosition.value.x - activeItemPosition.value.x - offset.x;
      }

      return {
        activeItemKey: key,
        indexToKey: indexToKey.value,
        itemPositions: itemPositions.value,
        keyToIndex: keyToIndex.value,
        snapBasedOffset
      };
    }, [
      indexToKey,
      keyToIndex,
      activeHandleMeasurements,
      activeHandleOffset,
      activeItemDimensions,
      enableActiveItemSnap,
      snapOffsetX,
      snapOffsetY,
      activeItemKey,
      activeItemPosition,
      itemPositions,
      touchPosition,
      isVertical
    ]);

    // TODO - change to the function called in sync from the layout updater?
    // needs to be calculated before layout update
    // and only on item sizes update
    const additionalCrossOffset = useDerivedValue(() => {
      const props = getRemainingProps();

      if (props) {
        console.log(
          'calculateActiveItemCrossOffset',
          calculateActiveItemCrossOffset({
            crossCoordinate,
            crossGap: crossGap.value,
            crossItemSizes: crossItemSizes.value,
            numGroups,
            ...props
          })
        );
        return calculateActiveItemCrossOffset({
          crossCoordinate,
          crossGap: crossGap.value,
          crossItemSizes: crossItemSizes.value,
          numGroups,
          ...props
        });
      }

      return null;
    });

    useAnimatedReaction(
      () => additionalCrossOffset.value !== null,
      isManaged => {
        const ctx = context.value;
        const prev = ctx.prevSortEnabled;

        if (ctx.restoreSortEnabledTimeoutId) {
          clearAnimatedTimeout(ctx.restoreSortEnabledTimeoutId);
        }

        if (isManaged && prev === undefined) {
          ctx.prevSortEnabled = sortEnabled.value;
          sortEnabled.value = false;
        } else if (prev !== undefined) {
          ctx.restoreSortEnabledTimeoutId = setAnimatedTimeout(() => {
            sortEnabled.value = prev;
            delete ctx.prevSortEnabled;
          }, SORT_ENABLED_RESTORE_TIMEOUT);
        }
      }
    );

    return {
      children: (
        <>
          {children}
          {hasAutoScroll && (
            <ScrollOffsetUpdater
              autoAdjustOffsetScrollPadding={autoAdjustOffsetScrollPadding}
              crossCoordinate={crossCoordinate}
              crossItemSizes={crossItemSizes}
              ctx={context}
              isVertical={isVertical}
              layoutUpdateProgress={layoutUpdateProgress}
            />
          )}
        </>
      ),
      value: {
        additionalCrossOffset,
        layoutUpdateProgress
      }
    };
  });

type ScrollOffsetUpdaterProps = {
  isVertical: boolean;
  crossCoordinate: Coordinate;
  crossItemSizes: SharedValue<ItemSizes>;
  autoAdjustOffsetScrollPadding: [number, number] | number;
  layoutUpdateProgress: SharedValue<null | number>;
  ctx: SharedValue<StateContext>;
};

function ScrollOffsetUpdater({
  autoAdjustOffsetScrollPadding,
  crossCoordinate,
  crossItemSizes,
  ctx,
  isVertical,
  layoutUpdateProgress
}: ScrollOffsetUpdaterProps) {
  const { activeItemKey, containerRef, itemPositions, prevActiveItemKey } =
    useCommonValuesContext();
  const { scrollableRef, scrollBy } = useAutoScrollContext()!;

  const [paddingBefore, paddingAfter] = toPair(autoAdjustOffsetScrollPadding);

  const scrollOffset = useScrollViewOffset(scrollableRef);

  const finishOffsetInterpolation = useCallback(() => {
    'worklet';
    layoutUpdateProgress.value = null;
    delete ctx.value.offsetInterpolationBounds;
  }, [layoutUpdateProgress, ctx]);

  useAnimatedReaction(
    () => itemPositions.value,
    (newPositions, oldPositions) => {
      if (
        !oldPositions ||
        activeItemKey.value !== null ||
        prevActiveItemKey.value === null
      ) {
        return;
      }

      const oldPos = oldPositions[prevActiveItemKey.value]?.[crossCoordinate];
      const newPos = newPositions[prevActiveItemKey.value]?.[crossCoordinate];
      const scrollableMeasurements = measure(scrollableRef);
      const containerMeasurements = measure(containerRef);
      const newSize = resolveDimension(
        crossItemSizes.value,
        prevActiveItemKey.value
      );

      if (
        newPos === undefined ||
        oldPos === undefined ||
        newSize === null ||
        !scrollableMeasurements ||
        !containerMeasurements
      ) {
        return;
      }

      const {
        height: sH,
        pageX: sX,
        pageY: sY,
        width: sW
      } = scrollableMeasurements;
      const { pageX: cX, pageY: cY } = containerMeasurements;

      const scrollableCrossSize = isVertical ? sH : sW;
      const relativeOffset = isVertical ? sY - cY : sX - cX;
      const oldPosOffset = oldPos - relativeOffset;
      const newPosOffset = clamp(
        oldPosOffset,
        paddingBefore,
        scrollableCrossSize - newSize - paddingAfter
      );

      const distance = newPos - oldPos + (oldPosOffset - newPosOffset);
      const currentOffset = scrollOffset.value;

      console.log(
        newPos,
        oldPos,
        oldPosOffset,
        newPosOffset,
        currentOffset,
        activeItemKey.value
      );

      // TODO - debounce these calls or do sth else as sometimes, when the item is
      // immediately released after drag starts, we get 2 dimension updates in a row
      // matching conditions of this reaction, which results in the scrollBy being
      // called with an invalid distance
      layoutUpdateProgress.value = 0;
      ctx.value.offsetInterpolationBounds = [
        currentOffset,
        currentOffset + distance
      ];
      scrollBy?.(distance, true);
    }
  );

  useAnimatedReaction(
    () => scrollOffset.value,
    offset => {
      const bounds = ctx.value.offsetInterpolationBounds;
      if (!bounds) {
        return;
      }

      layoutUpdateProgress.value = interpolate(
        offset,
        bounds,
        [0, 1],
        Extrapolation.CLAMP
      );

      if (!areValuesDifferent(layoutUpdateProgress.value, 1, 0.01)) {
        finishOffsetInterpolation();
      }
    }
  );

  return null;
}

export { AutoOffsetAdjustmentProvider, useAutoOffsetAdjustmentContext };
