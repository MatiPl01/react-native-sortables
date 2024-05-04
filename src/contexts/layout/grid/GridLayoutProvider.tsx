import { type PropsWithChildren, useCallback } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { StyleSheet, View } from 'react-native';
import {
  type SharedValue,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue
} from 'react-native-reanimated';

import { OFFSET_EPS } from '../../../constants';
import type { Position } from '../../../types';
import { areArraysDifferent, arePositionsDifferent } from '../../../utils';
import { useMeasurementsContext, usePositionsContext } from '../../shared';
import { createGuardedContext } from '../../utils';
import { getColumnIndex, getRowIndex } from './utils';

type GridLayoutContextType = {
  columnWidth: SharedValue<number>;
  containerHeight: SharedValue<number>;
  rowOffsets: SharedValue<Array<number>>;
};

type GridLayoutProviderProps = PropsWithChildren<{
  columnsCount: number;
}>;

const { GridLayoutProvider, useGridLayoutContext } = createGuardedContext(
  'GridLayout'
)<GridLayoutContextType, GridLayoutProviderProps>(({
  children,
  columnsCount
}) => {
  const { itemDimensions } = useMeasurementsContext();
  const { indexToKey, itemPositions } = usePositionsContext();

  const rowOffsets = useSharedValue<Array<number>>([]);

  const containerWidth = useSharedValue(-1);
  const containerHeight = useDerivedValue(
    () => rowOffsets.value[rowOffsets.value.length - 1] ?? -1
  );
  const columnWidth = useDerivedValue(() =>
    containerWidth.value === -1 ? -1 : containerWidth.value / columnsCount
  );

  // ROW OFFSETS UPDATER
  useAnimatedReaction(
    () => ({
      dimensions: itemDimensions.value,
      idxToKey: indexToKey.value
    }),
    ({ dimensions, idxToKey }) => {
      const offsets = [0];
      for (const [itemIndex, key] of Object.entries(idxToKey)) {
        const rowIndex = getRowIndex(parseInt(itemIndex), columnsCount);
        const itemHeight = dimensions[key]?.height;

        // Return if the item height is not yet measured
        if (itemHeight === undefined) {
          return;
        }

        offsets[rowIndex + 1] = Math.max(
          offsets[rowIndex + 1] ?? 0,
          (offsets[rowIndex] ?? 0) + itemHeight
        );
      }
      // Update row offsets only if they have changed
      if (
        areArraysDifferent(
          offsets,
          rowOffsets.value,
          (a, b) => Math.abs(a - b) < OFFSET_EPS
        )
      ) {
        rowOffsets.value = offsets;
      }
    },
    [columnsCount]
  );

  // ITEM POSITIONS UPDATER
  useAnimatedReaction(
    () => ({
      colWidth: columnWidth.value,
      idxToKey: indexToKey.value,
      offsets: rowOffsets.value
    }),
    ({ colWidth, idxToKey, offsets }) => {
      if (colWidth === -1 || offsets.length === 0) {
        return;
      }
      const positions: Record<string, Position> = {};

      for (const [itemIndex, key] of Object.entries(idxToKey)) {
        const rowIndex = getRowIndex(parseInt(itemIndex), columnsCount);
        const colIndex = getColumnIndex(parseInt(itemIndex), columnsCount);

        const y = offsets[rowIndex];
        if (y === undefined) {
          return;
        }

        const currentPosition = itemPositions.value[key];
        const calculatedPosition = {
          x: colIndex * colWidth,
          y
        };

        // Re-use existing position object if its properties are the same
        // (this prevents unnecessary reaction triggers in item components)
        positions[key] =
          !currentPosition ||
          arePositionsDifferent(currentPosition, calculatedPosition)
            ? calculatedPosition
            : currentPosition;
      }

      itemPositions.value = positions;
    },
    [columnsCount]
  );

  const handleMeasurement = useCallback(
    ({
      nativeEvent: {
        layout: { width }
      }
    }: LayoutChangeEvent) => {
      containerWidth.value = width;
    },
    [containerWidth]
  );

  return {
    children: (
      <View style={styles.container} onLayout={handleMeasurement}>
        {children}
      </View>
    ),
    value: {
      columnWidth,
      containerHeight,
      rowOffsets
    }
  };
});

const styles = StyleSheet.create({
  container: {
    width: '100%'
  }
});

export { GridLayoutProvider, useGridLayoutContext };
