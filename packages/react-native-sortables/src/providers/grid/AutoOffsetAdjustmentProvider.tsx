import type { PropsWithChildren } from 'react';
import { useCallback } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import {
  clamp,
  measure,
  useAnimatedReaction,
  useDerivedValue
} from 'react-native-reanimated';

import type {
  AutoOffsetAdjustmentContextType,
  Coordinate,
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
      touchPosition
    } = useCommonValuesContext();
    const { activeHandleMeasurements, activeHandleOffset } =
      useCustomHandleContext() ?? {};
    const hasAutoScroll = !!useAutoScrollContext();

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

    const additionalCrossOffset = useDerivedValue(() => {
      const props = getRemainingProps();

      if (props) {
        return calculateActiveItemCrossOffset({
          crossCoordinate,
          crossGap: crossGap.value,
          crossItemSizes: crossItemSizes.value,
          numGroups,
          ...props
        });
      }

      return 0;
    });

    return {
      children: (
        <>
          {children}
          {hasAutoScroll && (
            <ScrollOffsetUpdater
              autoAdjustOffsetScrollPadding={autoAdjustOffsetScrollPadding}
              crossCoordinate={crossCoordinate}
              crossItemSizes={crossItemSizes}
              isVertical={isVertical}
            />
          )}
        </>
      ),
      value: {
        additionalCrossOffset
      }
    };
  });

type ScrollOffsetUpdaterProps = {
  isVertical: boolean;
  crossCoordinate: Coordinate;
  crossItemSizes: SharedValue<ItemSizes>;
  autoAdjustOffsetScrollPadding: [number, number] | number;
};

function ScrollOffsetUpdater({
  autoAdjustOffsetScrollPadding,
  crossCoordinate,
  crossItemSizes,
  isVertical
}: ScrollOffsetUpdaterProps) {
  const { containerRef, itemPositions, prevActiveItemKey } =
    useCommonValuesContext();
  const { scrollableRef, scrollBy } = useAutoScrollContext()!;

  const [paddingBefore, paddingAfter] = toPair(autoAdjustOffsetScrollPadding);

  useAnimatedReaction(
    () => itemPositions.value,
    (newPositions, oldPositions) => {
      'worklet';

      if (!oldPositions || prevActiveItemKey.value === null) {
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

      console.log(
        'posDiff',
        newPos - oldPos,
        'newPosOffset',
        newPosOffset,
        'oldPosOffset',
        oldPosOffset
      );

      scrollBy?.(distance, true);
    }
  );

  return null;
}

export { AutoOffsetAdjustmentProvider, useAutoOffsetAdjustmentContext };
