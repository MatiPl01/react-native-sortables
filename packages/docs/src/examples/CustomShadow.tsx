import React, { memo, useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle
} from 'react-native-reanimated';
import Sortable, { useItemContext } from 'react-native-sortables';

const DATA = Array.from({ length: 12 }, (_, index) => `Item ${index + 1}`);

const GridItem = memo(function GridItem({ item }: { item: string }) {
  const { activationAnimationProgress } = useItemContext();

  const animatedStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      activationAnimationProgress.value,
      [0, 1],
      ['transparent', '#1a433f']
    );
    return {
      boxShadow: `0 5px 10px ${color}`
    };
  });

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      <Text style={styles.text}>{item}</Text>
    </Animated.View>
  );
});

export default function CustomShadowExample() {
  const renderItem = useCallback(
    ({ item }: { item: string }) => <GridItem item={item} />,
    []
  );

  return (
    <View style={styles.container}>
      <Sortable.Grid
        // Disable default shadow as we will apply our
        // box-shadow in the item component
        activeItemShadowOpacity={0}
        columnGap={10}
        columns={3}
        data={DATA}
        renderItem={renderItem}
        rowGap={10}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: '#36877F',
    borderRadius: 10,
    height: 100,
    justifyContent: 'center'
  },
  container: {
    padding: 16
  },
  text: {
    color: 'white',
    fontWeight: 'bold'
  }
});
