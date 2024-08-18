import type { PropsWithChildren } from 'react';
import { useCallback } from 'react';
import type { LayoutChangeEvent, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';

import { EMPTY_OBJECT } from '../../../constants';
import type { Dimensions } from '../../../types';
import { useCommonValuesContext } from '../../shared';
import { createProvider } from '../../utils';
import {
  areDimensionsCorrect,
  calculateLayout,
  getGroupSizes,
  groupItems,
  isDimensionRestricted
} from './utils';

type FlexLayoutContextType = {
  stretch: boolean;
  flexDirection: Required<ViewStyle['flexDirection']>;
  itemGroups: SharedValue<Array<Array<string>>>;
  keyToGroup: SharedValue<Record<string, number>>;
  crossAxisGroupSizes: SharedValue<Array<number>>;
  crossAxisGroupOffsets: SharedValue<Array<number>>;
};

type FlexLayoutProviderProps = PropsWithChildren<ViewStyle>;

const { FlexLayoutProvider, useFlexLayoutContext } = createProvider(
  'FlexLayout'
)<FlexLayoutProviderProps, FlexLayoutContextType>(({
  alignContent = 'flex-start',
  alignItems = 'stretch',
  children,
  columnGap: columnGapProp,
  flexDirection = 'row',
  flexWrap = 'nowrap',
  gap = 0,
  height = 'auto',
  justifyContent = 'flex-start',
  rowGap: rowGapProp,
  width = '100%'
}) => {
  const stretch = alignItems === 'stretch';
  const groupBy = flexDirection.startsWith('column') ? 'height' : 'width';
  const columnGap = columnGapProp ?? gap;
  const rowGap = rowGapProp ?? gap;

  const {
    indexToKey,
    itemDimensions,
    itemPositions,
    overrideItemDimensions,
    targetContainerHeight,
    targetContainerWidth
  } = useCommonValuesContext();

  const measuredHeight = useSharedValue<null | number>(null);
  const measuredWidth = useSharedValue<null | number>(null);

  const itemGroups = useSharedValue<Array<Array<string>>>([]);
  const keyToGroup = useSharedValue<Record<string, number>>({});
  const crossAxisGroupSizes = useSharedValue<Array<number>>([]);
  const crossAxisGroupOffsets = useSharedValue<Array<number>>([]);

  // ITEM GROUPS UPDATER
  useAnimatedReaction(
    () => ({
      dimensions: itemDimensions.value,
      idxToKey: indexToKey.value,
      measuredDimensions: {
        height: measuredHeight.value,
        width: measuredWidth.value
      }
    }),
    ({ dimensions, idxToKey, measuredDimensions }) => {
      if (!areDimensionsCorrect(measuredDimensions)) {
        return;
      }

      // Group items based on the layout direction
      const groups = groupItems(
        idxToKey,
        dimensions,
        groupBy === 'height' ? rowGap : columnGap,
        groupBy,
        flexWrap === 'nowrap' ? Infinity : measuredDimensions[groupBy]
      );
      if (!groups) return;

      // Calculate group cross axis sizes
      const sizes = getGroupSizes(
        groups,
        dimensions,
        groupBy === 'height' ? 'width' : 'height'
      );

      console.log({ dimensions, groups, sizes });

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
    [groupBy, flexWrap, columnGap, rowGap, width, height]
  );

  // ITEM POSITIONS UPDATER
  useAnimatedReaction(
    () => ({
      groups: itemGroups.value,
      restrictedHeight:
        groupBy === 'height' || isDimensionRestricted(height)
          ? measuredHeight.value
          : -1,
      restrictedWidth:
        groupBy === 'width' || isDimensionRestricted(width)
          ? measuredWidth.value
          : -1,
      sizes: crossAxisGroupSizes.value
    }),
    ({ groups, restrictedHeight, restrictedWidth, sizes }) => {
      // console.log({ groups, restrictedHeight, restrictedWidth, sizes });
      if (
        restrictedWidth === null ||
        restrictedHeight === null ||
        !groups.length ||
        !sizes.length
      ) {
        itemPositions.value = EMPTY_OBJECT;
        if (groupBy === 'width') {
          targetContainerHeight.value = 0;
        } else {
          targetContainerWidth.value = 0;
        }
        return;
      }

      const result = calculateLayout(
        groups,
        groupBy,
        sizes,
        itemDimensions.value,
        {
          height: restrictedHeight,
          width: restrictedWidth
        },
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
        targetContainerWidth.value = result.containerWidth;
        targetContainerHeight.value = result.containerHeight;
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
    ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
      measuredHeight.value = layout.height;
      measuredWidth.value = layout.width;
    },
    [measuredHeight, measuredWidth]
  );

  return {
    children: (
      <>
        <View
          style={[styles.container, { backgroundColor: 'red', height, width }]}
          onLayout={measureContainer}
        />
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
