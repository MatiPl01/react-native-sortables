import type { StyleProp, ViewStyle } from 'react-native';
import type { AnimatedStyle, SharedValue } from 'react-native-reanimated';
import {
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

import { EMPTY_OBJECT } from '../../../constants';
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
    activeItemKey,
    activeItemPosition,
    canSwitchToAbsoluteLayout,
    dropAnimationDuration,
    itemPositions
  } = useCommonValuesContext();

  const zIndex = useItemZIndex(key, pressProgress);
  const hasPressProgress = useDerivedValue(() => pressProgress.value > 0);
  const dx = useSharedValue<null | number>(null);
  const dy = useSharedValue<null | number>(null);

  const translateX = useSharedValue<null | number>(null);
  const translateY = useSharedValue<null | number>(null);
  const layoutX = useSharedValue<null | number>(null);
  const layoutY = useSharedValue<null | number>(null);

  useAnimatedReaction(
    () => ({
      position: key !== null ? itemPositions.value[key] : null
    }),
    ({ position }) => {
      if (!position) {
        return;
      }

      if (
        (layoutX.value === null || layoutY.value === null) &&
        dx.value !== null &&
        dy.value !== null
      ) {
        layoutX.value = 0;
        layoutY.value = 0;
      }

      if (pressProgress?.value) {
        // If the progress of the item press animation is greater than 0, that means
        // the item is being dragged or was dropped and haven't reached the final
        // position yet. In this case, we just update deltas to properly position
        // the item considering the current translation.
        dx.value = position.x - (layoutX.value ?? 0);
        dy.value = position.y - (layoutY.value ?? 0);
      } else if (
        !canSwitchToAbsoluteLayout.value ||
        (dx.value !== null && dy.value !== null)
      ) {
        // If transitioning from the relative layout (!canSwitchToAbsoluteLayout.value)
        // or if deltas are already set (so the item is already in the correct position),
        // we can react to the position changes and set the position values directly.
        if (dx.value === null || dy.value === null) {
          dx.value = 0;
          dy.value = 0;
        }
        layoutX.value = position.x - dx.value;
        layoutY.value = position.y - dy.value;
      } else {
        // If the absolute layout is already applied, the item will be rendered
        // in the top-left corner by default (so its position is 0, 0). In this
        // case we can't set x, y position values because they will be animated
        // from 0, 0 by the layout animation. In such a case, we apply transform
        // to the item to make it appear in the correct position and set deltas
        // to make future updates via the layout animation.
        dx.value = position.x;
        dy.value = position.y;
      }
    }
  );

  useAnimatedReaction(
    () => {
      const isActive = activeItemKey.value === key;
      return {
        hasProgress: hasPressProgress.value,
        isActive,
        position: isActive ? activeItemPosition.value : itemPositions.value[key]
      };
    },
    ({ hasProgress, isActive, position }) => {
      if (!position) {
        return;
      }

      const newX = position.x - (layoutX.value ?? 0);
      const newY = position.y - (layoutY.value ?? 0);

      if (
        isActive ||
        ((layoutX.value === null || layoutY.value === null) && !hasProgress)
      ) {
        // Apply the translation immediately if the item is being dragged or
        // the item was mounted with the absolute position and we cannot set
        // its top, left values because they will be animated from 0, 0 by the
        // layout animation.
        translateX.value = newX;
        translateY.value = newY;
        if (layoutX.value === null || layoutY.value === null) {
          layoutX.value = 0;
          layoutY.value = 0;
        }
      } else if (hasProgress) {
        // If the was released (has press progress but is no longer touched),
        // we animate the translation to the target position.
        translateX.value = withTiming(newX, {
          duration: dropAnimationDuration.value
        });
        translateY.value = withTiming(newY, {
          duration: dropAnimationDuration.value
        });
      } else if (translateX.value === null || translateY.value === null) {
        // If the item was mounted with the relative position, we set the
        // translation to 0, 0. This just indicates that transformation values
        // are set to proper values and the absolute position can be applied.
        translateX.value = 0;
        translateY.value = 0;
      }
    }
  );

  const animatedTranslationStyle = useAnimatedStyle(() => {
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

  const animatedLayoutStyle = useAnimatedStyle(() => {
    if (!canSwitchToAbsoluteLayout.value) {
      return EMPTY_OBJECT;
    }

    return {
      left: layoutX.value,
      top: layoutY.value
    };
  });

  return [animatedTranslationStyle, animatedLayoutStyle];
}
