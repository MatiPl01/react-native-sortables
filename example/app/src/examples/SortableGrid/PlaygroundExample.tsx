import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { SortableGridRenderItem } from 'react-native-sortables';
import Sortable from 'react-native-sortables';

import { colors, radius, sizes, spacing, text } from '@/theme';
import Animated, { useAnimatedRef } from 'react-native-reanimated';

const DATA = Array.from({ length: 12 }, (_, index) => `Item ${index + 1}`);

export default function PlaygroundExample() {
  const renderItem = useCallback<SortableGridRenderItem<string>>(
    ({ item }) => (
      <View style={[styles.card, { height: Math.random() * 400 + 100 }]}>
        <Text style={styles.text}>{item}</Text>
      </View>
    ),
    []
  );

  const ref = useAnimatedRef<Animated.ScrollView>();

  return (
    <Animated.ScrollView style={styles.container} ref={ref}>
      <Sortable.Grid
        debug
        data={DATA}
        renderItem={renderItem}
        scrollableRef={ref}
        columns={1}
        enableActiveItemSnap={false}
        activeItemScale={1.03}
        hapticsEnabled
        rowGap={10}
      />
    </Animated.ScrollView>
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
