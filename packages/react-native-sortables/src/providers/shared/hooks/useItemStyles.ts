import type { ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { useAnimatedStyle } from 'react-native-reanimated';

import type { AnimatedStyleProp } from '../../../integrations/reanimated';
import { mergeStyles } from '../../../utils';
import { useCommonValuesContext } from '../CommonValuesProvider';
import useItemDecorationValues from './useItemDecorationValues';
import useItemPosition from './useItemPosition';
import useItemZIndex from './useItemZIndex';

const RELATIVE_STYLE: ViewStyle = {
  position: 'relative'
};

const HIDDEN_STYLE: ViewStyle = {
  left: -9999,
  position: 'absolute'
};

export default function useItemStyles(
  key: string,
  isActive: SharedValue<boolean>,
  activationAnimationProgress: SharedValue<number>
): AnimatedStyleProp {
  const { usesAbsoluteLayout } = useCommonValuesContext();

  const zIndex = useItemZIndex(key, activationAnimationProgress);
  const position = useItemPosition(key, isActive, activationAnimationProgress);
  const decoration = useItemDecorationValues(
    key,
    isActive,
    activationAnimationProgress
  );

  return useAnimatedStyle(() => {
    if (!usesAbsoluteLayout.value) {
      return mergeStyles(RELATIVE_STYLE, decoration.value);
    }

    if (!position.value) {
      return HIDDEN_STYLE;
    }

    return mergeStyles(
      {
        left: 0,
        position: 'absolute',
        transform: [
          { translateX: position.value.x },
          { translateY: position.value.y }
        ],
        zIndex: zIndex.value
      },
      decoration.value
    );
  });
}
