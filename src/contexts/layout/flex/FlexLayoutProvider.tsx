import { type PropsWithChildren, useCallback } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';

import { EMPTY_OBJECT } from '../../../constants';
import { useMeasurementsContext, usePositionsContext } from '../../../contexts';
import { createGuardedContext } from '../../utils';
import type { FlexProps, ItemGroups } from './types';
import { groupItems } from './utils';

type FlexLayoutContextType = {
  containerHeight: SharedValue<number>;
};

type FlexLayoutProviderProps = PropsWithChildren<FlexProps>;

const { FlexLayoutProvider, useFlexLayoutContext } = createGuardedContext(
  'FlexLayout'
)<FlexLayoutContextType, FlexLayoutProviderProps>(({
  alignContent = 'flex-start',
  // alignItems = 'flex-start',
  children,
  columnGap: columnGapProp,
  flexDirection = 'row',
  flexWrap = 'nowrap',
  gap = 0,
  justifyContent = 'flex-start',
  rowGap: rowGapProp
}) => {
  const columnGap = columnGapProp ?? gap;
  const rowGap = rowGapProp ?? gap;

  const { containerWidth, itemDimensions } = useMeasurementsContext();
  const { indexToKey, itemPositions } = usePositionsContext();

  const containerHeight = useSharedValue(-1);

  const itemGroups = useSharedValue<ItemGroups>([]);

  // ITEM GROUPS UPDATER
  useAnimatedReaction(
    () => ({
      dimensions: itemDimensions.value,
      idxToKey: indexToKey.value,
      maxHeight: containerHeight.value,
      maxWidth: containerWidth.value
    }),
    ({ dimensions, idxToKey, maxHeight, maxWidth }) => {
      if (maxHeight === -1 || maxWidth === -1) {
        return;
      }

      // Group items based on the layout direction
      const groupBy = flexDirection.startsWith('column') ? 'height' : 'width';
      const itemsGap = groupBy === 'height' ? rowGap : columnGap;
      let limit: number;

      if (flexWrap === 'nowrap') {
        limit = Infinity;
      } else if (groupBy === 'height') {
        limit = maxHeight;
      } else {
        limit = maxWidth;
      }

      const groups = groupItems(idxToKey, dimensions, itemsGap, groupBy, limit);

      if (groups) {
        itemGroups.value = groups;
      }
    },
    [flexDirection, flexWrap, columnGap, rowGap]
  );

  // ITEM POSITIONS UPDATER
  useAnimatedReaction(
    () => ({
      dimensions: itemDimensions.value,
      groups: itemGroups.value
    }),
    ({ groups }) => {
      if (!groups.length) {
        itemPositions.value = EMPTY_OBJECT;
        return;
      }

      // const positions = [].reduce()
    },
    [flexDirection, justifyContent, alignContent, rowGap, columnGap]
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
