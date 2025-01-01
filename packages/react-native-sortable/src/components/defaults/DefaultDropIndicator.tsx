import Animated, {
  interpolate,
  useAnimatedStyle
} from 'react-native-reanimated';

import type { DropIndicatorComponentProps } from '../../types';

export default function DefaultDropIndicator({
  activationProgress,
  style
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

  return <Animated.View style={[style, animatedStyle]} />;
}
