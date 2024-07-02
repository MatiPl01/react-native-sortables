import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  SortableGrid,
  SortableGridRenderItem,
  ReorderStrategy,
  SortableGridProps
} from '@lib';
import { useCallback, useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import { Slider } from '../components';

const STRATEGIES: ReorderStrategy[] = ['insert', 'swap'];

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
    data: TILES,
    renderItem,
    columns,
    reorderStrategy: strategy,
    dragEnabled,
    activeItemScale,
    activeItemOpacity,
    activeItemShadowOpacity,
    inactiveItemOpacity,
    inactiveItemScale
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
          <Slider from={1} to={2} current={activeItemScale} />
        </View>
      </View>

      <View style={styles.optionsRow}>
        <Text style={styles.optionText}>Active Item Opacity</Text>
        <View style={styles.options}>
          <Slider from={0} to={1} current={activeItemOpacity} />
        </View>
      </View>

      <View style={styles.optionsRow}>
        <Text style={styles.optionText}>Active Item Shadow Opacity</Text>
        <View style={styles.options}>
          <Slider from={0} to={1} current={activeItemShadowOpacity} />
        </View>
      </View>

      <View style={styles.optionsRow}>
        <Text style={styles.optionText}>Inactive Item Opacity</Text>
        <View style={styles.options}>
          <Slider from={0} to={1} current={inactiveItemOpacity} />
        </View>
      </View>

      <View style={styles.optionsRow}>
        <Text style={styles.optionText}>Inactive Item Scale</Text>
        <View style={styles.options}>
          <Slider from={0} to={1} current={inactiveItemScale} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 5,
    marginHorizontal: 20,
    gap: 10,
    minHeight: 40
  },
  optionText: {
    flexBasis: 1,
    flexGrow: 1,
    fontWeight: 'bold'
  },
  options: {
    flexBasis: 1,
    flexGrow: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  tile: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  oddTile: {
    backgroundColor: '#FFA500'
  },
  evenTile: {
    backgroundColor: '#FF4500'
  },
  tileText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5
  }
});
