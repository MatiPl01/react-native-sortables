import { useCallback } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import { useDerivedValue } from 'react-native-reanimated';

import type { AdditionalCrossOffsetContextType } from '../../types';
import { useCommonValuesContext } from '../shared';
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
      activeItemDropped,
      activeItemKey,
      activeItemPosition,
      indexToKey,
      itemHeights,
      itemPositions,
      itemWidths,
      keyToIndex,
      prevActiveItemKey,
      snapOffsetPosition,
      touchPosition
    } = useCommonValuesContext();

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
      return {
        activeItemKey: activeItemKey.value ?? prevActiveItemKey.value,
        itemPositions: itemPositions.value
      };
    }, [activeItemKey, itemPositions, prevActiveItemKey]);

    const additionalCrossOffset = useDerivedValue(() => {
      const { activeItemKey: activeKey, ...rest } = getRemainingProps();

      if (!activeItemDropped.value && activeKey !== null) {
        return calculateActiveItemCrossOffset({
          activeItemKey: activeKey,
          crossCoordinate,
          crossGap: crossGap.value,
          crossItemSizes: crossItemSizes.value,
          indexToKey: indexToKey.value,
          keyToIndex: keyToIndex.value,
          numGroups,
          ...rest
        });
      }

      return 0;
    });

    return { value: { additionalCrossOffset } };
  });

export { AdditionalCrossOffsetProvider, useAdditionalCrossOffsetContext };
