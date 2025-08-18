import { useCallback } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';

import type { AdditionalCrossOffsetContextType } from '../../types';
import { calculateSnapOffset } from '../../utils';
import { useCommonValuesContext, useCustomHandleContext } from '../shared';
import { createProvider } from '../utils';
import { calculateActiveItemCrossOffset } from './layout/utils';

type AdditionalCrossOffsetProviderProps = {
  isVertical: boolean;
  columnGap: SharedValue<number>;
  rowGap: SharedValue<number>;
  numGroups: number;
};

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
      prevActiveItemKey,
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

    const additionalCrossSnapOffset = useSharedValue(0);

    const getRemainingProps = useCallback(() => {
      'worklet';
      const key = activeItemKey.value ?? prevActiveItemKey.value;
      if (key === null) {
        return 0;
      }

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
        additionalCrossSnapOffset.value = isVertical
          ? touchPosition.value.y - activeItemPosition.value.y - offset.y
          : touchPosition.value.x - activeItemPosition.value.x - offset.x;
      }

      return {
        activeItemKey: key,
        itemPositions: itemPositions.value,
        snapBasedOffset: additionalCrossSnapOffset.value
      };
    }, [
      activeHandleMeasurements,
      activeHandleOffset,
      activeItemDimensions,
      additionalCrossSnapOffset,
      enableActiveItemSnap,
      snapOffsetX,
      snapOffsetY,
      activeItemKey,
      activeItemPosition,
      itemPositions,
      prevActiveItemKey,
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
          indexToKey: indexToKey.value,
          keyToIndex: keyToIndex.value,
          numGroups,
          ...props
        });
      }

      return 0;
    });

    return { value: { additionalCrossOffset, additionalCrossSnapOffset } };
  });

export { AdditionalCrossOffsetProvider, useAdditionalCrossOffsetContext };
