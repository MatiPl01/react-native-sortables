import { type PropsWithChildren, useCallback } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';

import { EMPTY_OBJECT } from '@/constants';
import { useMeasurementsContext, usePositionsContext } from '@/contexts/shared';
import { createGuardedContext } from '@/contexts/utils';
import type { Dimensions } from '@/types';

import type { FlexDirection, FlexProps } from './types';
import {
  areDimensionsCorrect,
  calculateLayout,
  getGroupSizes,
  groupItems
} from './utils';

type FlexLayoutContextType = {
  stretch: boolean;
  flexDirection: FlexDirection;
  itemGroups: SharedValue<Array<Array<string>>>;
  keyToGroup: SharedValue<Record<string, number>>;
  crossAxisGroupSizes: SharedValue<Array<number>>;
  crossAxisGroupOffsets: SharedValue<Array<number>>;
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

  const {
    containerHeight,
    containerWidth,
    itemDimensions,
    overrideItemDimensions
  } = useMeasurementsContext();
  const { indexToKey, itemPositions } = usePositionsContext();

  const itemGroups = useSharedValue<Array<Array<string>>>([]);
  const keyToGroup = useSharedValue<Record<string, number>>({});
  const crossAxisGroupSizes = useSharedValue<Array<number>>([]);
  const crossAxisGroupOffsets = useSharedValue<Array<number>>([]);

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

      // Update key to group mapping
      const keyToGroupMapping: Record<string, number> = {};
      groups.forEach((group, index) => {
        group.forEach(key => {
          keyToGroupMapping[key] = index;
        });
      });
      keyToGroup.value = keyToGroupMapping;
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

      const result = calculateLayout(
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

      if (result) {
        itemPositions.value = result.itemPositions;
        crossAxisGroupOffsets.value = result.crossAxisGroupOffsets;
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
      crossAxisGroupOffsets,
      crossAxisGroupSizes,
      flexDirection,
      itemGroups,
      keyToGroup,
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
