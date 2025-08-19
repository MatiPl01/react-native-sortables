import type { PropsWithChildren } from 'react';
import { useCallback } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import { useDerivedValue } from 'react-native-reanimated';

import type { AdditionalCrossOffsetContextType } from '../../types';
import { calculateSnapOffset } from '../../utils';
import { useCommonValuesContext, useCustomHandleContext } from '../shared';
import { createProvider } from '../utils';
import { calculateActiveItemCrossOffset } from './layout/utils';

type AdditionalCrossOffsetProviderProps = PropsWithChildren<{
  isVertical: boolean;
  columnGap: SharedValue<number>;
  rowGap: SharedValue<number>;
  numGroups: number;
}>;

const { AdditionalCrossOffsetProvider, useAdditionalCrossOffsetContext } =
  createProvider('AdditionalCrossOffset', {
    guarded: false
  })<AdditionalCrossOffsetProviderProps, AdditionalCrossOffsetContextType>(({
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
      value: {
        additionalCrossOffset
      }
    };
  });

export { AdditionalCrossOffsetProvider, useAdditionalCrossOffsetContext };
