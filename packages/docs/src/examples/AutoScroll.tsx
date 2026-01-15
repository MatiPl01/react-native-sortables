import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import Sortable from 'react-native-sortables';

const DATA = Array.from({ length: 30 }, (_, index) => `Item ${index + 1}`);

export default function AutoScrollExample() {
  const scrollableRef = useAnimatedRef<Animated.ScrollView>();

  const renderItem = useCallback(
    ({ item }: { item: string }) => (
      <View style={styles.card}>
        <Text style={styles.text}>{item}</Text>
      </View>
    ),
    []
  );

  return (
    <Animated.ScrollView
      style={{
        height: 400 // Limit height to enable scrolling in demo
      }}
      contentContainerStyle={styles.contentContainer}
      ref={scrollableRef}>
      <Sortable.Grid
        columnGap={10}
        columns={3}
        data={DATA}
        renderItem={renderItem}
        rowGap={10}
        scrollableRef={scrollableRef} // required for auto scroll
      />
    </Animated.ScrollView>
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
  contentContainer: {
    padding: 10
  },
  text: {
    color: 'white',
    fontWeight: 'bold'
  }
});
