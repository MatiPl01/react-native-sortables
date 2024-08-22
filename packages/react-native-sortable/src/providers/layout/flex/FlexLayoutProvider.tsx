import { type PropsWithChildren, useCallback } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';

import { EMPTY_OBJECT } from '../../../constants';
import { useAnimatableValue } from '../../../hooks';
import type { Dimensions } from '../../../types';
import { useCommonValuesContext } from '../../shared';
import { createProvider } from '../../utils';
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
  rowGap: SharedValue<number>;
  columnGap: SharedValue<number>;
};

type FlexLayoutProviderProps = PropsWithChildren<FlexProps>;

const { FlexLayoutProvider, useFlexLayoutContext } = createProvider(
  'FlexLayout'
)<FlexLayoutProviderProps, FlexLayoutContextType>(({
  alignContent = 'flex-start',
  alignItems = 'stretch',
  children,
  columnGap: columnGap_,
  flexDirection = 'row',
  flexWrap = 'nowrap',
  gap = 0,
  justifyContent = 'flex-start',
  rowGap: rowGap_
}) => {
  const stretch = alignItems === 'stretch';
  const groupBy = flexDirection.startsWith('column') ? 'height' : 'width';
  const columnGap = useAnimatableValue(columnGap_ ?? gap);
  const rowGap = useAnimatableValue(rowGap_ ?? gap);

  const {
    containerHeight,
    containerWidth,
    indexToKey,
    itemDimensions,
    itemPositions,
    overrideItemDimensions
  } = useCommonValuesContext();

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
      groupGap: groupBy === 'height' ? rowGap.value : columnGap.value,
      idxToKey: indexToKey.value
    }),
    ({ containerDimensions, dimensions, groupGap, idxToKey }) => {
      if (!areDimensionsCorrect(containerDimensions)) {
        return;
      }

      // Group items based on the layout direction
      const groups = groupItems(
        idxToKey,
        dimensions,
        groupGap,
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
    [groupBy, flexWrap]
  );

  // ITEM POSITIONS UPDATER
  useAnimatedReaction(
    () => ({
      containerDimensions: {
        height: containerHeight.value,
        width: containerWidth.value
      },
      gaps: {
        columnGap: columnGap.value,
        rowGap: rowGap.value
      },
      groups: itemGroups.value,
      sizes: crossAxisGroupSizes.value
    }),
    ({ containerDimensions, gaps, groups, sizes }) => {
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
          ...gaps,
          alignContent,
          alignItems,
          flexWrap,
          justifyContent
        }
      );

      if (result) {
        itemPositions.value = result.itemPositions;
        crossAxisGroupOffsets.value = result.crossAxisGroupOffsets;
      }
    },
    [groupBy, alignContent, alignItems, flexWrap, justifyContent]
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
      columnGap,
      crossAxisGroupOffsets,
      crossAxisGroupSizes,
      flexDirection,
      itemGroups,
      keyToGroup,
      overrideItemDimensions,
      rowGap,
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
