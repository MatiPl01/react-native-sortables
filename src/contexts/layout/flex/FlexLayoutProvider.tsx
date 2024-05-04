import { type PropsWithChildren, useCallback } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';

import { useMeasurementsContext, usePositionsContext } from '../../../contexts';
import { createGuardedContext } from '../../utils';
import type { FlexProps } from './types';
import { groupItems } from './utils';

type FlexLayoutContextType = {
  containerHeight: SharedValue<number>;
};

type FlexLayoutProviderProps = PropsWithChildren<FlexProps>;

const { FlexLayoutProvider, useFlexLayoutContext } = createGuardedContext(
  'FlexLayout'
)<FlexLayoutContextType, FlexLayoutProviderProps>(({
  children,
  // alignContent = 'flex-start',
  // alignItems = 'flex-start',
  // children,
  // columnGap = 0,
  flexDirection = 'row',
  flexWrap = 'nowrap'
  // gap,
  // justifyContent = 'flex-start',
  // rowGap = 0
}) => {
  const { containerWidth, itemDimensions } = useMeasurementsContext();
  const { indexToKey, itemPositions } = usePositionsContext();

  const containerHeight = useSharedValue(-1);

  const itemGroups = useSharedValue<Array<Array<string>>>([]);

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

      const groups = flexDirection.startsWith('column')
        ? groupItems(idxToKey, dimensions, 'height', maxHeight)
        : groupItems(idxToKey, dimensions, 'width', maxWidth);

      if (groups) {
        itemGroups.value = groups;
      }
    },
    [flexDirection, flexWrap]
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
