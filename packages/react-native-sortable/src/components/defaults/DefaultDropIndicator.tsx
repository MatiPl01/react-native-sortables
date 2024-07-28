import { StyleSheet } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle
} from 'react-native-reanimated';

import type { DropIndicatorComponentProps } from '../shared';

export default function DefaultDropIndicator({
  activationProgress
}: DropIndicatorComponentProps): JSX.Element {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: activationProgress.value,
    transform: [
      {
        scale: interpolate(
          Math.pow(activationProgress.value, 1 / 3),
          [0, 1],
          [1.1, 1]
        )
      }
    ]
  }));

  return <Animated.View style={[styles.indicator, animatedStyle]} />;
}

const styles = StyleSheet.create({
  indicator: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderColor: 'black',
    borderRadius: 10,
    borderStyle: 'dashed',
    borderWidth: 2,
    flex: 1
  }
});
