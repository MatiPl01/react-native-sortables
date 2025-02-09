import Animated, {
  interpolate,
  useAnimatedStyle
} from 'react-native-reanimated';

import type { DropIndicatorComponentProps } from '../../types';

export default function DefaultDropIndicator({
  activeAnimationProgress,
  style
}: DropIndicatorComponentProps): JSX.Element {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: style.opacity ?? activeAnimationProgress.value,
    transform: style.transform ?? [
      {
        scale: interpolate(
          Math.pow(activeAnimationProgress.value, 1 / 3),
          [0, 1],
          [1.1, 1]
        )
      }
    ]
  }));

  return <Animated.View style={[style, animatedStyle]} />;
}
