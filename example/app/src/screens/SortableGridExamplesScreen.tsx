import { useCallback, useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import type {
  ReorderStrategy,
  SortableGridProps,
  SortableGridRenderItem
} from 'react-native-sortable';
import { SortableGrid } from 'react-native-sortable';

import { Slider } from '@/components';

const STRATEGIES: Array<ReorderStrategy> = ['insert', 'swap'];

const COLUMNS = [4, 5, 6];

const TILES = new Array(25).fill(null).map((_, index) => index + 1);

type TileProps = {
  index: number;
};

function Tile({ index }: TileProps) {
  return (
    <View style={[styles.tile, index % 2 ? styles.oddTile : styles.evenTile]}>
      <Text style={styles.tileText}>{index}</Text>
    </View>
  );
}

export default function SortableGridExamplesScreen() {
  const [dragEnabled, setDragEnabled] = useState(true);
  const [strategy, setStrategy] = useState<ReorderStrategy>(STRATEGIES[0]!);
  const [columns, setColumns] = useState(5); // TODO - fix size calculations and positioning

  const activeItemScale = useSharedValue(1.1);
  const activeItemOpacity = useSharedValue(1);
  const activeItemShadowOpacity = useSharedValue(0.2);
  const inactiveItemOpacity = useSharedValue(0.5);
  const inactiveItemScale = useSharedValue(1);

  const renderItem = useCallback<SortableGridRenderItem<number>>(
    ({ item }) => <Tile index={item} />,
    []
  );

  const props: SortableGridProps<number> = {
    activeItemOpacity,
    activeItemScale,
    activeItemShadowOpacity,
    columns,
    data: TILES,
    dragEnabled,
    inactiveItemOpacity,
    inactiveItemScale,
    renderItem,
    reorderStrategy: strategy
  };

  return (
    <ScrollView>
      <SortableGrid {...props} />

      <View style={styles.optionsRow}>
        <Text style={styles.optionText}>Drag Enabled</Text>
        <Button
          title={dragEnabled ? 'disable' : 'enable'}
          onPress={() => {
            setDragEnabled(!dragEnabled);
          }}
        />
      </View>

      <View style={styles.optionsRow}>
        <Text style={styles.optionText}>Reorder Strategy</Text>
        <View style={styles.options}>
          {STRATEGIES.map(s => (
            <Button
              disabled={strategy === s}
              key={s}
              title={s}
              onPress={() => {
                setStrategy(s);
              }}
            />
          ))}
        </View>
      </View>

      <View style={styles.optionsRow}>
        <Text style={styles.optionText}>Columns</Text>
        <View style={styles.options}>
          {COLUMNS.map(c => (
            <Button
              disabled={columns === c}
              key={c}
              title={c.toString()}
              onPress={() => {
                setColumns(c);
              }}
            />
          ))}
        </View>
      </View>

      <View style={styles.optionsRow}>
        <Text style={styles.optionText}>Active Item Scale</Text>
        <View style={styles.options}>
          <Slider current={activeItemScale} from={1} to={2} />
        </View>
      </View>

      <View style={styles.optionsRow}>
        <Text style={styles.optionText}>Active Item Opacity</Text>
        <View style={styles.options}>
          <Slider current={activeItemOpacity} from={0} to={1} />
        </View>
      </View>

      <View style={styles.optionsRow}>
        <Text style={styles.optionText}>Active Item Shadow Opacity</Text>
        <View style={styles.options}>
          <Slider current={activeItemShadowOpacity} from={0} to={1} />
        </View>
      </View>

      <View style={styles.optionsRow}>
        <Text style={styles.optionText}>Inactive Item Opacity</Text>
        <View style={styles.options}>
          <Slider current={inactiveItemOpacity} from={0} to={1} />
        </View>
      </View>

      <View style={styles.optionsRow}>
        <Text style={styles.optionText}>Inactive Item Scale</Text>
        <View style={styles.options}>
          <Slider current={inactiveItemScale} from={0} to={1} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  evenTile: {
    backgroundColor: '#FF4500'
  },
  oddTile: {
    backgroundColor: '#FFA500'
  },
  optionText: {
    flexBasis: 1,
    flexGrow: 1,
    fontWeight: 'bold'
  },
  options: {
    flexBasis: 1,
    flexDirection: 'row',
    flexGrow: 1,
    justifyContent: 'flex-end'
  },
  optionsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginVertical: 5,
    minHeight: 40
  },
  tile: {
    alignItems: 'center',
    aspectRatio: 1,
    justifyContent: 'center'
  },
  tileText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { height: 1, width: -1 },
    textShadowRadius: 5
  }
});
