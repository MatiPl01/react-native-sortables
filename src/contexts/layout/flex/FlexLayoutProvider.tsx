import { type PropsWithChildren, useCallback } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';

import { EMPTY_OBJECT } from '../../../constants';
import { useMeasurementsContext, usePositionsContext } from '../..';
import { createGuardedContext } from '../../utils';
import type { FlexProps } from './types';
import { areDimensionsCorrect, getItemPositions, groupItems } from './utils';

type FlexLayoutContextType = {
  containerHeight: SharedValue<number>;
};

type FlexLayoutProviderProps = PropsWithChildren<FlexProps>;

const { FlexLayoutProvider, useFlexLayoutContext } = createGuardedContext(
  'FlexLayout'
)<FlexLayoutContextType, FlexLayoutProviderProps>(({
  alignContent = 'flex-start',
  alignItems = 'flex-start',
  children,
  columnGap: columnGapProp,
  flexDirection = 'row',
  flexWrap = 'nowrap',
  gap = 0,
  justifyContent = 'flex-start',
  rowGap: rowGapProp
}) => {
  const groupBy = flexDirection.startsWith('column') ? 'height' : 'width';
  const columnGap = columnGapProp ?? gap;
  const rowGap = rowGapProp ?? gap;

  const { containerWidth, itemDimensions } = useMeasurementsContext();
  const { indexToKey, itemPositions } = usePositionsContext();

  const containerHeight = useSharedValue(-1);

  const itemGroups = useSharedValue<Array<Array<string>>>([]);

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

      if (groups) {
        itemGroups.value = groups;
      }
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
      groups: itemGroups.value
    }),
    ({ containerDimensions, groups }) => {
      if (!areDimensionsCorrect(containerDimensions) || !groups.length) {
        itemPositions.value = EMPTY_OBJECT;
        return;
      }

      const positions = getItemPositions(
        groups,
        groupBy,
        itemDimensions.value,
        containerDimensions,
        {
          alignContent,
          alignItems,
          columnGap,
          justifyContent,
          rowGap
        }
      );

      if (positions) {
        itemPositions.value = positions;

        console.log('\n\npositions: ', JSON.stringify(positions, null, 2));
      }
    },
    [groupBy, alignContent, alignItems, columnGap, justifyContent, rowGap]
  );

  const measureContainer = useCallback(
    ({
      nativeEvent: {
        layout: { height }
      }
    }: LayoutChangeEvent) => {
      // TODO - improve (calculate height if it is not set)
      console.log({ height });
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
      containerHeight
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
