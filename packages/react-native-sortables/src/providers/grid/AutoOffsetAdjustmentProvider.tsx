import type { PropsWithChildren } from 'react';
import { useCallback } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import {
  clamp,
  measure,
  useAnimatedReaction,
  useScrollViewOffset
} from 'react-native-reanimated';

import { useMutableValue } from '../../integrations/reanimated';
import type {
  AutoOffsetAdjustmentContextType,
  Coordinate,
  GridLayoutProps,
  ItemSizes
} from '../../types';
import { calculateSnapOffset, resolveDimension, toPair } from '../../utils';
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
  autoAdjustOffsetScrollPadding: [number, number] | number;
}>;

const { AutoOffsetAdjustmentProvider, useAutoOffsetAdjustmentContext } =
  createProvider('AutoOffsetAdjustment', {
    guarded: false
  })<AutoOffsetAdjustmentProviderProps, AutoOffsetAdjustmentContextType>(({
    autoAdjustOffsetScrollPadding,
    children
  }) => {
    const {
      activeItemDimensions,
      activeItemKey,
      activeItemPosition,
      enableActiveItemSnap,
      itemPositions,
      keyToIndex,
      snapOffsetX,
      snapOffsetY,
      sortEnabled,
      touchPosition
    } = useCommonValuesContext();
    const { activeHandleMeasurements, activeHandleOffset } =
      useCustomHandleContext() ?? {};
    const hasAutoScroll = !!useAutoScrollContext();

    const additionalCrossOffset = useMutableValue<null | number>(null);
    const layoutUpdateProgress = useMutableValue<null | number>(null);

    const context = useMutableValue<StateContext>({});

    const adaptLayoutProps = useCallback(
      (props: GridLayoutProps, prevProps: GridLayoutProps | null) => {
        'worklet';
        const activeKey = activeItemKey.value;
        if (activeKey === null) {
          additionalCrossOffset.value = null;
          return props;
        }

        const {
          gaps,
          indexToKey,
          isVertical,
          itemHeights,
          itemWidths,
          numGroups
        } = props;
        const crossItemSizes = isVertical ? itemHeights : itemWidths;
        const prevCrossIteSizes = isVertical
          ? prevProps?.itemHeights
          : prevProps?.itemWidths;
        const sizesChanged = crossItemSizes !== prevCrossIteSizes;

        if (!sizesChanged) {
          return { ...props, startCrossOffset: additionalCrossOffset.value };
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

        const startCrossOffset = calculateActiveItemCrossOffset({
          activeItemKey: activeKey,
          crossCoordinate: isVertical ? 'y' : 'x',
          crossGap: gaps.cross,
          crossItemSizes,
          indexToKey: indexToKey,
          itemPositions: itemPositions.value,
          keyToIndex: keyToIndex.value,
          numGroups,
          snapBasedOffset
        });

        additionalCrossOffset.value = startCrossOffset;

        return {
          ...props,
          startCrossOffset
        };
      },
      [
        activeItemKey,
        activeHandleMeasurements,
        activeHandleOffset,
        activeItemDimensions,
        activeItemPosition,
        additionalCrossOffset,
        enableActiveItemSnap,
        itemPositions,
        keyToIndex,
        snapOffsetX,
        snapOffsetY,
        touchPosition
      ]
    );

    // useAnimatedReaction(
    //   () => additionalCrossOffset.value !== null,
    //   isManaged => {
    //     const ctx = context.value;
    //     const prev = ctx.prevSortEnabled;

    //     if (ctx.restoreSortEnabledTimeoutId) {
    //       clearAnimatedTimeout(ctx.restoreSortEnabledTimeoutId);
    //     }

    //     if (isManaged && prev === undefined) {
    //       ctx.prevSortEnabled = sortEnabled.value;
    //       sortEnabled.value = false;
    //     } else if (prev !== undefined) {
    //       ctx.restoreSortEnabledTimeoutId = setAnimatedTimeout(() => {
    //         sortEnabled.value = prev;
    //         delete ctx.prevSortEnabled;
    //       }, SORT_ENABLED_RESTORE_TIMEOUT);
    //     }
    //   }
    // );

    return {
      children: (
        <>
          {children}
          {/* {hasAutoScroll && (
            <ScrollOffsetUpdater
              autoAdjustOffsetScrollPadding={autoAdjustOffsetScrollPadding}
              crossCoordinate={crossCoordinate}
              crossItemSizes={crossItemSizes}
              ctx={context}
              isVertical={isVertical}
            />
          )} */}
        </>
      ),
      value: {
        adaptLayoutProps,
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
  // layoutUpdateProgress: SharedValue<null | number>;
  ctx: SharedValue<StateContext>;
};

function ScrollOffsetUpdater({
  autoAdjustOffsetScrollPadding,
  crossCoordinate,
  crossItemSizes,
  ctx,
  isVertical
  // layoutUpdateProgress
}: ScrollOffsetUpdaterProps) {
  const {
    activeItemKey,
    containerRef,
    itemPositions,
    prevActiveItemKey,
    shouldAnimateLayout
  } = useCommonValuesContext();
  const { scrollableRef, scrollBy } = useAutoScrollContext()!;

  const [paddingBefore, paddingAfter] = toPair(autoAdjustOffsetScrollPadding);

  const scrollOffset = useScrollViewOffset(scrollableRef);

  // const finishOffsetInterpolation = useCallback(() => {
  //   'worklet';
  //   layoutUpdateProgress.value = null;
  //   delete ctx.value.offsetInterpolationBounds;
  // }, [layoutUpdateProgress, ctx]);

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
      // layoutUpdateProgress.value = 0;
      // ctx.value.offsetInterpolationBounds = [
      //   currentOffset,
      //   currentOffset + distance
      // ];
      // shouldAnimateLayout.value = false;
      // scrollBy?.(distance, false);
    }
  );

  // useAnimatedReaction(
  //   () => scrollOffset.value,
  //   offset => {
  //     const bounds = ctx.value.offsetInterpolationBounds;
  //     if (!bounds) {
  //       return;
  //     }

  //     layoutUpdateProgress.value = interpolate(
  //       offset,
  //       bounds,
  //       [0, 1],
  //       Extrapolation.CLAMP
  //     );

  //     if (!areValuesDifferent(layoutUpdateProgress.value, 1, 0.01)) {
  //       finishOffsetInterpolation();
  //     }
  //   }
  // );

  return null;
}

export { AutoOffsetAdjustmentProvider, useAutoOffsetAdjustmentContext };
