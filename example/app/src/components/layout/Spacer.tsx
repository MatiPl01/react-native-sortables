import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { useAnimatableValue } from '@/hooks';
import type { Animatable } from '@/types';

type SpacerProps =
  | {
      height: Animatable<number>;
      width: Animatable<number>;
    }
  | {
      height: Animatable<number>;
      width?: never;
    }
  | {
      height?: never;
      width: Animatable<number>;
    };

export default function Spacer({ height, width }: SpacerProps) {
  const heightValue = useAnimatableValue(height ?? 0);
  const widthValue = useAnimatableValue(width ?? 0);

  const animatedStyle = useAnimatedStyle(() => ({
    marginTop: heightValue.value,
    width: widthValue.value
  }));

  return <Animated.View style={animatedStyle} />;
}
