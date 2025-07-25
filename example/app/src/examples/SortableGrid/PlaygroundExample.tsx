import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  PerformanceMonitor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming
} from 'react-native-reanimated';

const BOX_SIZE = 30;
const COUNT = 300;
const TRAVEL = 200; // px each direction
const DURATION = 2000; // ms for one leg of the journey

function MovingBox({ index, mode }: { index: number; mode: string }) {
  // 0 → 1 shared progress value animated back‑and‑forth forever
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: DURATION }),
      -1,
      true /* yoyo */
    );
  }, []);

  const animatedStyleTransform = useAnimatedStyle(() => {
    const offset = progress.value * TRAVEL;
    return {
      transform: [
        { translateX: index * 2 + offset },
        { translateY: index * 2 + offset }
      ]
    };
  });

  const animatedStylePosition = useAnimatedStyle(() => {
    const offset = progress.value * TRAVEL;
    return {
      left: index * 2 + offset,
      top: index * 2 + offset
    };
  });

  return (
    <Animated.View
      key={mode}
      style={[
        styles.box,
        mode === 'transform' ? animatedStyleTransform : animatedStylePosition
      ]}>
      <Text>{index}</Text>
    </Animated.View>
  );
}

export default function App() {
  const [mode, setMode] = useState('transform');
  //--------------------------------------------------------------------

  const boxes = Array.from({ length: COUNT }, (_, i) => (
    <MovingBox index={i} key={i} mode={mode} />
  ));

  return (
    <SafeAreaView style={styles.container}>
      {/* --- Header --------------------------------------------------- */}

      <Pressable
        style={styles.button}
        onPress={() =>
          setMode(prev => (prev === 'transform' ? 'position' : 'transform'))
        }>
        <Text style={styles.buttonText}>Mode: {mode} (tap to toggle)</Text>
      </Pressable>
      <PerformanceMonitor />

      {/* --- Animated playground ------------------------------------- */}
      <View style={styles.stage}>{boxes}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: '#61dafb',
    borderRadius: 6,
    height: BOX_SIZE,
    position: 'absolute',
    width: BOX_SIZE
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#282c34',
    padding: 12
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  container: { backgroundColor: '#0e0e0e', flex: 1 },
  stage: { flex: 1, position: 'relative' }
});
