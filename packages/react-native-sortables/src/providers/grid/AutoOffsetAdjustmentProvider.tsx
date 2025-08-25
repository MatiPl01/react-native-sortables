import type { PropsWithChildren } from 'react';
import { useCallback } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import Animated, {
  useAnimatedStyle,
  useDerivedValue
} from 'react-native-reanimated';

import type { AutoOffsetAdjustmentContextType } from '../../types';
import { calculateSnapOffset } from '../../utils';
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
}>;

const { AutoOffsetAdjustmentProvider, useAutoOffsetAdjustmentContext } =
  createProvider('AutoOffsetAdjustment', {
    guarded: false
  })<AutoOffsetAdjustmentProviderProps, AutoOffsetAdjustmentContextType>(({
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
      containerHeight,
      containerWidth,
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
    const { scrollOffsetDiff } = useAutoScrollContext() ?? {};
    const { activeHandleMeasurements, activeHandleOffset } =
      useCustomHandleContext() ?? {};

    let crossContainerSize, crossCoordinate, crossGap, crossItemSizes;
    if (isVertical) {
      crossGap = rowGap;
      crossItemSizes = itemHeights;
      crossContainerSize = containerHeight;
      crossCoordinate = 'y' as const;
    } else {
      crossGap = columnGap;
      crossItemSizes = itemWidths;
      crossContainerSize = containerWidth;
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

    const sizeRatio = useDerivedValue(() => {
      const sizes = crossItemSizes.value;
      const containerSize = crossContainerSize.value;
      if (!sizes || !containerSize || typeof sizes !== 'object') {
        return 0;
      }

      const contentSize = Math.max(
        0,
        Object.values(sizes).reduce(
          (acc, size) => acc + size + crossGap.value,
          -crossGap.value
        )
      );

      console.log('...', contentSize / containerSize);

      return contentSize / containerSize;
    });

    const animatedContainerStyle = useAnimatedStyle(() => ({
      transform: [
        {
          translateY: (scrollOffsetDiff?.value?.y ?? 0) * (1 - sizeRatio.value)
        }
      ]
    }));

    return {
      children: (
        <Animated.View style={animatedContainerStyle}>{children}</Animated.View>
      ),
      value: {
        additionalCrossOffset
      }
    };
  });

export { AutoOffsetAdjustmentProvider, useAutoOffsetAdjustmentContext };
