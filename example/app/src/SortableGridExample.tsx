import { StyleSheet, Text, View } from 'react-native';
import { SortableGrid, SortableGridRenderItem } from '@lib';
import { useCallback } from 'react';

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

export default function SortableGridExample() {
  const renderItem = useCallback<SortableGridRenderItem<number>>(
    ({ item }) => <Tile index={item} />,
    []
  );

  return (
    <>
      <SortableGrid
        data={TILES}
        renderItem={renderItem}
        columns={5}
        reorderStrategy='insert'
      />
      <View style={styles.footer}>
        <Text style={styles.footerText}>Grid footer</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
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
  },
  footer: {
    height: 100,
    backgroundColor: '#FF6347',
    justifyContent: 'center',
    alignItems: 'center'
  },
  footerText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold'
  }
});
