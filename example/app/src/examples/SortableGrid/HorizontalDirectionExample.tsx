import { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { SortableGridRenderItem } from 'react-native-sortables';
import Sortable from 'react-native-sortables';

import { Screen } from '@/components';
import { colors, radius, sizes, spacing, text } from '@/theme';
import Animated from 'react-native-reanimated';

const DATA = Array.from({ length: 12 }, (_, index) => `Item ${index + 1}`);

export default function HorizontalDirectionExample() {
  const renderItem = useCallback<SortableGridRenderItem<string>>(
    ({ item }) => (
      <View style={styles.card}>
        <Text style={styles.text}>{item}</Text>
      </View>
    ),
    []
  );

  return (
    <Screen>
      <Sortable.Grid
        columnGap={10}
        data={DATA}
        renderItem={renderItem}
        rowGap={10}
        rows={3}
        rowHeight={sizes.xl}
      />
      {/* <View style={{ flexDirection: 'column', flexWrap: 'wrap', height: 300 }}>
        <Card item='1' />
        <Card item='2' />
        <Card item='3' />
        <Card item='4' />
      </View> */}
    </Screen>
  );
}

function Card({ item }: { item: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.text}>{item}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: '#36877F',
    borderRadius: radius.md,
    height: sizes.xl,
    justifyContent: 'center'
  },
  container: {
    padding: spacing.md
  },
  text: {
    ...text.label2,
    color: colors.white
  }
});
