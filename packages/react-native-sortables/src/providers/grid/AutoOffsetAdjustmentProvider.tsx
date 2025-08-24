import type { PropsWithChildren } from 'react';
import { useCallback } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import { useDerivedValue } from 'react-native-reanimated';

import { useMutableValue } from '../../integrations/reanimated';
import type { AutoOffsetAdjustmentContextType, Vector } from '../../types';
import { calculateSnapOffset } from '../../utils';
import { useCommonValuesContext, useCustomHandleContext } from '../shared';
import { createProvider } from '../utils';
import { calculateActiveItemCrossOffset } from './GridLayoutProvider/utils';

type AutoOffsetAdjustmentProviderProps = PropsWithChildren<{
  isVertical: boolean;
  columnGap: SharedValue<number>;
  rowGap: SharedValue<number>;
  numGroups: number;
}>;

const { AutoOffsetAdjustmentProvider, useAutoOffsetAdjustmentContext } =
  createProvider('AutoOffsetAdjustment', {
    guarded: false
  })<AutoOffsetAdjustmentProviderProps, AutoOffsetAdjustmentContextType>(({
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
      prevActiveItemKey,
      snapOffsetX,
      snapOffsetY,
      touchPosition
    } = useCommonValuesContext();
    const { activeHandleMeasurements, activeHandleOffset } =
      useCustomHandleContext() ?? {};

    const wasPreviouslyActive = useMutableValue(false);

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

    const calculateOffsetShift = useCallback(
      (
        newItemPositions: Record<string, Vector>,
        prevItemPositions: Record<string, Vector>
      ): null | number => {
        'worklet';
        const isActive = activeItemKey.value !== null;
        const wasActive = wasPreviouslyActive.value;
        wasPreviouslyActive.value = isActive;
        const key = prevActiveItemKey.value;

        if (isActive || !wasActive || key === null) {
          return null;
        }

        const newPos = newItemPositions[key];
        const prevPos = prevItemPositions[key];

        if (!newPos || !prevPos) {
          return null;
        }

        return newPos[crossCoordinate] - prevPos[crossCoordinate];
      },
      [activeItemKey, wasPreviouslyActive, prevActiveItemKey, crossCoordinate]
    );

    return {
      value: {
        additionalCrossOffset,
        calculateOffsetShift
      }
    };
  });

export { AutoOffsetAdjustmentProvider, useAutoOffsetAdjustmentContext };
