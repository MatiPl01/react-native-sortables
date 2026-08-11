import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import Sortable from 'react-native-sortables';

const DATA = [
  'Poland',
  'Germany',
  'France',
  'Italy',
  'Spain',
  'Portugal',
  'Greece',
  'Great Britain',
  'United States',
  'Canada',
  'Australia',
  'New Zealand',
  'Brazil',
  'Argentina',
  'Mexico',
  'Japan',
  'China',
  'India'
];

export default function FlexActiveItemPortalExample() {
  const [portalEnabled, setPortalEnabled] = useState(false);
  const scrollableRef = useAnimatedRef<Animated.ScrollView>();

  return (
    <View style={styles.container}>
      <Sortable.PortalProvider enabled={portalEnabled}>
        <View style={styles.flexContainer}>
          <Animated.ScrollView
            contentContainerStyle={styles.contentContainer}
            ref={scrollableRef}>
            <Sortable.Flex gap={10} scrollableRef={scrollableRef}>
              {DATA.map(item => (
                <View key={item} style={styles.cell}>
                  <Text numberOfLines={1} style={styles.text}>
                    {item}
                  </Text>
                </View>
              ))}
            </Sortable.Flex>
          </Animated.ScrollView>
        </View>
        <Pressable onPress={() => setPortalEnabled(prev => !prev)}>
          <Text
            style={
              styles.buttonText
            }>{`${portalEnabled ? 'Disable' : 'Enable'} Portal`}</Text>
        </Pressable>
      </Sortable.PortalProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonText: {
    color: 'var(--ifm-color-primary)',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15
  },
  cell: {
    alignItems: 'center',
    backgroundColor: 'var(--ifm-color-primary)',
    borderRadius: 9999,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  container: {
    alignItems: 'center',
    backgroundColor: 'var(--ifm-color-emphasis-100)',
    flex: 1,
    justifyContent: 'center',
    padding: 20
  },
  contentContainer: {
    padding: 10
  },
  flexContainer: {
    backgroundColor: 'var(--ifm-background-surface-color)',
    borderRadius: 10,
    height: 400,
    overflow: 'hidden',
    width: '100%'
  },
  text: {
    color: 'white',
    fontWeight: 'bold'
  }
});
