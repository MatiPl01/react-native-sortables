import { type PropsWithChildren, useCallback } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';

import { EMPTY_OBJECT } from '../../../constants';
import type { Dimensions } from '../../../types';
import { useMeasurementsContext, usePositionsContext } from '../..';
import { createGuardedContext } from '../../utils';
import type { FlexProps } from './types';
import {
  areDimensionsCorrect,
  getGroupSizes,
  getItemPositions,
  groupItems
} from './utils';

type FlexLayoutContextType = {
  stretch: boolean;
  containerHeight: SharedValue<number>;
  overrideItemDimensions: SharedValue<Record<string, Partial<Dimensions>>>;
};

type FlexLayoutProviderProps = PropsWithChildren<FlexProps>;

const { FlexLayoutProvider, useFlexLayoutContext } = createGuardedContext(
  'FlexLayout'
)<FlexLayoutContextType, FlexLayoutProviderProps>(({
  alignContent = 'flex-start',
  alignItems = 'stretch',
  children,
  columnGap: columnGapProp,
  flexDirection = 'row',
  flexWrap = 'nowrap',
  gap = 0,
  justifyContent = 'flex-start',
  rowGap: rowGapProp
}) => {
  const stretch = alignItems === 'stretch';
  const groupBy = flexDirection.startsWith('column') ? 'height' : 'width';
  const columnGap = columnGapProp ?? gap;
  const rowGap = rowGapProp ?? gap;

  const { containerWidth, itemDimensions } = useMeasurementsContext();
  const { indexToKey, itemPositions } = usePositionsContext();

  const containerHeight = useSharedValue(-1);
  const overrideItemDimensions = useSharedValue<
    Record<string, Partial<Dimensions>>
  >({});

  const itemGroups = useSharedValue<Array<Array<string>>>([]);
  const crossAxisGroupSizes = useSharedValue<Array<number>>([]);

  // ITEM GROUPS UPDATER
  useAnimatedReaction(
    () => ({
      containerDimensions: {
        height: containerHeight.value,
        width: containerWidth.value
      },
      dimensions: itemDimensions.value,
      idxToKey: indexToKey.value
    }),
    ({ containerDimensions, dimensions, idxToKey }) => {
      if (!areDimensionsCorrect(containerDimensions)) {
        return;
      }

      // Group items based on the layout direction
      const groups = groupItems(
        idxToKey,
        dimensions,
        groupBy === 'height' ? rowGap : columnGap,
        groupBy,
        flexWrap === 'nowrap' ? Infinity : containerDimensions[groupBy]
      );
      if (!groups) return;

      // Calculate group cross axis sizes
      const sizes = getGroupSizes(
        groups,
        dimensions,
        groupBy === 'height' ? 'width' : 'height'
      );

      itemGroups.value = groups;
      crossAxisGroupSizes.value = sizes;
    },
    [groupBy, flexWrap, columnGap, rowGap]
  );

  // ITEM POSITIONS UPDATER
  useAnimatedReaction(
    () => ({
      containerDimensions: {
        height: containerHeight.value,
        width: containerWidth.value
      },
      groups: itemGroups.value,
      sizes: crossAxisGroupSizes.value
    }),
    ({ containerDimensions, groups, sizes }) => {
      if (
        !areDimensionsCorrect(containerDimensions) ||
        !groups.length ||
        !sizes.length
      ) {
        itemPositions.value = EMPTY_OBJECT;
        return;
      }

      const positions = getItemPositions(
        groups,
        groupBy,
        sizes,
        itemDimensions.value,
        containerDimensions,
        {
          alignContent,
          alignItems,
          columnGap,
          flexWrap,
          justifyContent,
          rowGap
        }
      );

      if (positions) {
        itemPositions.value = positions;
      }
    },
    [
      groupBy,
      alignContent,
      alignItems,
      columnGap,
      flexWrap,
      justifyContent,
      rowGap
    ]
  );

  // OVERRIDE ITEM DIMENSIONS UPDATER
  useAnimatedReaction(
    () => ({
      groupSizes: crossAxisGroupSizes.value,
      groups: itemGroups.value
    }),
    ({ groupSizes, groups }) => {
      if (!groupSizes.length || !groups.length || !stretch) {
        return;
      }

      const overriddenDimension = groupBy === 'height' ? 'width' : 'height';
      const overrideDimensions: Record<string, Partial<Dimensions>> = {};

      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        const groupSize = groupSizes[i];

        if (!group || groupSize === undefined) {
          return;
        }

        for (const key of group) {
          const currentDimensions = overrideItemDimensions.value[key];

          if (
            currentDimensions &&
            currentDimensions[overriddenDimension] === groupSize
          ) {
            overrideDimensions[key] = currentDimensions;
          } else {
            overrideDimensions[key] = {
              [overriddenDimension]: groupSize
            };
          }
        }
      }

      overrideItemDimensions.value = overrideDimensions;
    },
    [stretch]
  );

  const measureContainer = useCallback(
    ({
      nativeEvent: {
        layout: { height }
      }
    }: LayoutChangeEvent) => {
      // TODO - improve (calculate height if it is not set)
      containerHeight.value = height;
    },
    [containerHeight]
  );

  return {
    children: (
      <>
        <View style={styles.container} onLayout={measureContainer} />
        {children}
      </>
    ),
    value: {
      containerHeight,
      overrideItemDimensions,
      stretch
    }
  };
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none'
  }
});

export { FlexLayoutProvider, useFlexLayoutContext };
