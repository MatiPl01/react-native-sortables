import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import Sortable from 'react-native-sortables';

const DATA = Array.from({ length: 18 }, (_, index) => `Item ${index + 1}`);

export default function ActiveItemPortalExample() {
  const [portalEnabled, setPortalEnabled] = useState(false);
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
    <View style={styles.container}>
      <Sortable.PortalProvider enabled={portalEnabled}>
        <View style={styles.gridContainer}>
          <Animated.ScrollView
            contentContainerStyle={styles.contentContainer}
            ref={scrollableRef}>
            <Sortable.Grid
              columnGap={10}
              columns={3}
              data={DATA}
              renderItem={renderItem}
              rowGap={10}
              scrollableRef={scrollableRef}
            />
          </Animated.ScrollView>
        </View>
        <Pressable onPress={() => setPortalEnabled(prev => !prev)}>
          <Text style={styles.buttonText}>
            {`${portalEnabled ? 'Disable' : 'Enable'} Portal`}
          </Text>
        </Pressable>
      </Sortable.PortalProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DDE2E3'
  },
  gridContainer: {
    marginVertical: 15,
    borderRadius: 10,
    height: 400,
    width: '100%',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden'
  },
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
  },
  buttonText: {
    color: '#36877F',
    fontSize: 18,
    fontWeight: 'bold'
  }
});
