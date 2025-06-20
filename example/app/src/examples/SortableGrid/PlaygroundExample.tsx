import { useState } from 'react';
import { Button, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useDerivedValue,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated';

export default function PlaygroundExample() {
  const [animating, setAnimating] = useState(false);
  const [show, setShow] = useState(false);

  const animationProgress = useDerivedValue(() =>
    animating ? withRepeat(withSequence(withTiming(0), withTiming(1)), -1) : 0
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${animationProgress.value * 360}deg` }]
  }));

  return (
    <View style={styles.container}>
      <Button
        title={animating ? 'Stop animation' : 'Start animation'}
        onPress={() => {
          setAnimating(!animating);
        }}
      />
      <Button
        title={show ? 'Hide' : 'Show'}
        onPress={() => {
          setShow(!show);
        }}
      />
      {show && (
        <Animated.View style={animatedStyle}>
          <Animated.View
            entering={FadeIn.duration(1000)}
            exiting={FadeOut.duration(1000)}
            style={styles.box}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: 'red',
    height: 100,
    width: 100
  },
  container: {
    alignItems: 'center',
    flex: 1,
    gap: 10,
    padding: 10
  }
});
