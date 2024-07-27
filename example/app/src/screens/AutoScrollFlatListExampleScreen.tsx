import { useCallback } from 'react';
import type { ListRenderItem } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import {
  SortableGrid,
  type SortableGridRenderItem
} from 'react-native-sortable';

function createCards(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    description: 'This is a card',
    key: i,
    title: `Card ${i + 1}`
  }));
}

const FEW_CARDS = createCards(6);
const MANY_CARDS = createCards(20);

const LIST_ITEMS = Array.from({ length: 10 }, (_, i) => ({
  key: i,
  title: `Item ${i + 1}`
}));

export default function AutoScrollFlatListExampleScreen() {
  const scrollableRef =
    useAnimatedRef<Animated.FlatList<(typeof LIST_ITEMS)[number]>>();

  const renderGridItem = useCallback<
    SortableGridRenderItem<ReturnType<typeof createCards>[number]>
  >(
    ({ item }) => (
      <View style={styles.card}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    ),
    []
  );

  const renderListItem = useCallback<
    ListRenderItem<(typeof LIST_ITEMS)[number]>
  >(
    ({ item }) => (
      <View style={styles.card}>
        <Text style={styles.title}>{item.title}</Text>
      </View>
    ),
    []
  );

  const sharedProps = {
    activeItemScale: 1.15,
    activeItemShadowOpacity: 0.1,
    columns: 2,
    inactiveItemOpacity: 0.5,
    renderItem: renderGridItem,
    scrollableRef
  };

  return (
    <Animated.FlatList
      contentContainerStyle={styles.container}
      data={LIST_ITEMS}
      ListFooterComponentStyle={styles.foreground}
      ListHeaderComponentStyle={styles.foreground}
      ref={scrollableRef}
      renderItem={renderListItem}
      scrollEventThrottle={16}
      ListFooterComponent={
        <>
          <View style={styles.section}>
            <Text style={styles.title}>Before SortableGrid in Footer</Text>
          </View>
          <SortableGrid data={MANY_CARDS} {...sharedProps} />
          <View style={styles.section}>
            <Text style={styles.title}>After SortableGrid in Footer</Text>
          </View>
        </>
      }
      ListHeaderComponent={
        <>
          <View style={styles.section}>
            <Text style={styles.title}>Before SortableGrid in Header</Text>
          </View>
          <SortableGrid data={FEW_CARDS} {...sharedProps} />
          <View style={styles.section}>
            <Text style={styles.title}>After SortableGrid in Header</Text>
          </View>
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    gap: 16,
    marginHorizontal: 6,
    marginVertical: 8,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84
  },
  container: {
    padding: 12
  },
  description: {
    fontSize: 14
  },
  foreground: {
    zIndex: 1
  },
  section: {
    alignItems: 'center',
    borderColor: 'black',
    borderRadius: 10,
    borderStyle: 'dashed',
    borderWidth: 1,
    height: 200,
    justifyContent: 'center',
    marginHorizontal: 6,
    marginVertical: 8
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold'
  }
});
