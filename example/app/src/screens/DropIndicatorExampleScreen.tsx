import { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import type {
  DropIndicatorComponentProps,
  SortableGridRenderItem
} from 'react-native-sortable';
import { SortableGrid } from 'react-native-sortable';

const COLUMNS = 3;
const NUM_CARDS = 2 * COLUMNS;
const CARDS = Array.from({ length: NUM_CARDS }, (_, i) => ({
  key: i,
  title: `Card ${i + 1}`
}));

const COLORS = new Array(NUM_CARDS).fill(null).map((_, i) => {
  const hue = (360 / NUM_CARDS) * i;
  return `hsl(${hue}, 100%, 50%)`;
});

function CustomDropIndicator({
  activationProgress,
  dropIndex,
  touchedItemKey
}: DropIndicatorComponentProps) {
  const indexes = useMemo(
    () => Array.from({ length: NUM_CARDS }, (_, i) => i),
    []
  );

  const scale = useSharedValue(0);
  const colorIndex = useSharedValue(0);
  const showIndicator = useDerivedValue(
    () => activationProgress.value > 0.2 && touchedItemKey.value !== null
  );

  useAnimatedReaction(
    () => ({
      index: dropIndex.value,
      show: showIndicator.value
    }),
    ({ index, show }, prev) => {
      if (show !== prev?.show) {
        scale.value = withSpring(+show);
      } else if (index !== prev?.index) {
        colorIndex.value = withTiming(index % NUM_CARDS);
        scale.value = withSequence(
          withTiming(0.75, { duration: 100 }),
          withSpring(1)
        );
      }
    }
  );

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(colorIndex.value, indexes, COLORS),
    transform: [{ scale: scale.value }]
  }));

  return <Animated.View style={[styles.customIndicator, animatedStyle]} />;
}

export default function DropIndicatorExampleScreen() {
  const renderItem = useCallback<
    SortableGridRenderItem<(typeof CARDS)[number]>
  >(
    ({ item }) => (
      <View style={styles.card}>
        <Text style={styles.title}>{item.title}</Text>
      </View>
    ),
    []
  );

  return (
    <ScrollView>
      <View style={styles.section}>
        <Text style={styles.title}>Without Drop Indicator</Text>
        <SortableGrid columns={COLUMNS} data={CARDS} renderItem={renderItem} />
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>Default Drop Indicator</Text>
        <SortableGrid
          columns={COLUMNS}
          data={CARDS}
          renderItem={renderItem}
          showDropIndicator
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>Custom Drop Indicator</Text>
        <SortableGrid
          columns={COLUMNS}
          data={CARDS}
          DropIndicatorComponent={CustomDropIndicator}
          renderItem={renderItem}
          showDropIndicator
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    justifyContent: 'center',
    marginHorizontal: 6,
    marginVertical: 8,
    minHeight: 80,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84
  },
  customIndicator: {
    borderRadius: 10,
    borderWidth: 2,
    flex: 1
  },
  section: {
    borderColor: 'black',
    borderRadius: 10,
    borderStyle: 'dashed',
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 12
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 6,
    marginVertical: 6
  }
});
