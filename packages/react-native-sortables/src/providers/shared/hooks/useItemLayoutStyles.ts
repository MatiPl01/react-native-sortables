import type { ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { useAnimatedStyle } from 'react-native-reanimated';

import type { AnimatedStyleProp } from '../../../types';
import { useCommonValuesContext } from '../CommonValuesProvider';
import useItemPosition from './useItemPosition';
import useItemZIndex from './useItemZIndex';

const RELATIVE_STYLE: ViewStyle = {
  position: 'relative',
  transform: [],
  zIndex: 0
};

const HIDDEN_STYLE: ViewStyle = {
  position: 'absolute',
  transform: [{ scale: 0 }],
  zIndex: -1
};

export default function useItemLayoutStyles(
  key: string,
  activationAnimationProgress: SharedValue<number>
): AnimatedStyleProp {
  const { usesAbsoluteLayout } = useCommonValuesContext();

  const zIndex = useItemZIndex(key, activationAnimationProgress);
  const position = useItemPosition(key, activationAnimationProgress);

  return useAnimatedStyle(() => {
    if (!usesAbsoluteLayout.value) {
      return RELATIVE_STYLE;
    }

    if (!position.value) {
      return HIDDEN_STYLE;
    }

    return {
      position: 'absolute',
      transform: [
        { translateX: position.value.x },
        { translateY: position.value.y }
      ],
      zIndex: zIndex.value
    };
  });
}
