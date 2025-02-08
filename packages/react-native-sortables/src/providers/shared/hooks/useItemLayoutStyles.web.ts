import type { StyleProp, ViewStyle } from 'react-native';
import type { AnimatedStyle, SharedValue } from 'react-native-reanimated';
import {
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

import { useCommonValuesContext } from '../CommonValuesProvider';
import useItemZIndex from './useItemZIndex';

const RELATIVE_STYLE: ViewStyle = {
  height: undefined,
  left: undefined,
  opacity: 1,
  position: 'relative',
  top: undefined,
  transform: [],
  width: undefined,
  zIndex: 0
};

const NO_TRANSLATION_STYLE: ViewStyle = {
  ...RELATIVE_STYLE,
  opacity: 0,
  position: 'absolute',
  zIndex: -1
};

export default function useItemLayoutStyles(
  key: string,
  pressProgress: SharedValue<number>
): StyleProp<AnimatedStyle<ViewStyle>> {
  const {
    canSwitchToAbsoluteLayout,
    dropAnimationDuration,
    itemPositions,
    touchedItemKey,
    touchedItemPosition
  } = useCommonValuesContext();

  const zIndex = useItemZIndex(key, pressProgress);
  const hasPressProgress = useDerivedValue(() => pressProgress.value > 0);

  const translateX = useSharedValue<null | number>(null);
  const translateY = useSharedValue<null | number>(null);

  useAnimatedReaction(
    () => {
      const isTouched = touchedItemKey.value === key;
      return {
        hasProgress: hasPressProgress.value,
        isTouched,
        position: isTouched
          ? touchedItemPosition.value
          : itemPositions.value[key]
      };
    },
    ({ hasProgress, isTouched, position }) => {
      if (!position) {
        return;
      }

      if (isTouched || translateX.value === null || translateY.value === null) {
        translateX.value = position.x;
        translateY.value = position.y;
      } else if (hasProgress) {
        translateX.value = withTiming(position.x, {
          duration: dropAnimationDuration.value
        });
        translateY.value = withTiming(position.y, {
          duration: dropAnimationDuration.value
        });
      }
    }
  );

  return useAnimatedStyle(() => {
    if (!canSwitchToAbsoluteLayout.value) {
      return RELATIVE_STYLE;
    }

    if (translateX.value === null || translateY.value === null) {
      return NO_TRANSLATION_STYLE;
    }

    return {
      opacity: 1,
      position: 'absolute',
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value }
      ],
      zIndex: zIndex.value
    };
  });
}
