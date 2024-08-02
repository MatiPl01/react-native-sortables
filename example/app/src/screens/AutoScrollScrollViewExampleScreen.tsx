import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import type { SortableGridRenderItem } from 'react-native-sortable';
import { SortableGrid } from 'react-native-sortable';

function createCards(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    description: 'This is a card',
    key: i,
    title: `Card ${i + 1}`
  }));
}

const FEW_CARDS = createCards(6);
const MANY_CARDS = createCards(20);

export default function AutoScrollScrollViewExampleScreen() {
  const scrollableRef = useAnimatedRef<Animated.ScrollView>();

  const renderItem = useCallback<
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

  const sharedProps = {
    activeItemScale: 1.15,
    activeItemShadowOpacity: 0.1,
    columnGap: 12,
    columns: 2,
    inactiveItemOpacity: 0.5,
    renderItem,
    rowGap: 12,
    scrollableRef
  };

  return (
    <Animated.ScrollView
      contentContainerStyle={styles.container}
      ref={scrollableRef}>
      <View style={styles.section}>
        <Text style={styles.title}>Before SortableGrid</Text>
      </View>
      <SortableGrid data={MANY_CARDS} {...sharedProps} />
      <View style={styles.section}>
        <Text style={styles.title}>Between SortableGrids</Text>
      </View>
      <SortableGrid data={FEW_CARDS} {...sharedProps} />
      <View style={styles.section}>
        <Text style={styles.title}>After SortableGrid</Text>
      </View>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    gap: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84
  },
  container: {
    padding: 20
  },
  description: {
    fontSize: 14
  },
  section: {
    alignItems: 'center',
    borderColor: 'black',
    borderRadius: 10,
    borderStyle: 'dashed',
    borderWidth: 1,
    height: 200,
    justifyContent: 'center',
    marginVertical: 12
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold'
  }
});
