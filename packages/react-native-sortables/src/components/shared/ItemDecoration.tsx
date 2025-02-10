import type { ViewProps, ViewStyle } from 'react-native';
import { Platform, StyleSheet } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withTiming
} from 'react-native-reanimated';

import { IS_WEB } from '../../constants';
import { useCommonValuesContext } from '../../providers';
import AnimatedOnLayoutView from './AnimatedOnLayoutView';

type ItemDecorationProps = {
  isBeingActivated: SharedValue<boolean>;
  pressProgress: SharedValue<number>;
  onLayout: NonNullable<ViewProps['onLayout']>;
  itemKey: string;
} & ViewProps;

export default function ItemDecoration({
  isBeingActivated,
  itemKey: key,
  pressProgress,
  ...rest
}: ItemDecorationProps) {
  const {
    activeAnimationDuration,
    activeItemOpacity,
    activeItemScale,
    activeItemShadowOpacity,
    inactiveAnimationProgress,
    inactiveItemOpacity,
    inactiveItemScale,
    itemsStyleOverride,
    prevActiveItemKey
  } = useCommonValuesContext();

  const adjustedInactiveProgress = useDerivedValue(() => {
    if (isBeingActivated.value || prevActiveItemKey.value === key) {
      return withTiming(0, { duration: activeAnimationDuration.value });
    }

    return interpolate(
      pressProgress.value,
      [0, 1],
      [inactiveAnimationProgress.value, 0]
    );
  });

  const animatedStyle = useAnimatedStyle(() => {
    const progress = pressProgress.value;
    const zeroProgressOpacity = interpolate(
      adjustedInactiveProgress.value,
      [0, 1],
      [1, inactiveItemOpacity.value]
    );
    const zeroProgressScale = interpolate(
      adjustedInactiveProgress.value,
      [0, 1],
      [1, inactiveItemScale.value]
    );

    const shadowColor = interpolateColor(
      progress,
      [0, 1],
      ['transparent', `rgba(0, 0, 0, ${activeItemShadowOpacity.value})`]
    );

    const shadow = IS_WEB
      ? { filter: `drop-shadow(0px 0px 5px ${shadowColor})` }
      : { shadowColor };

    return {
      ...shadow,
      opacity: interpolate(
        progress,
        [0, 1],
        [zeroProgressOpacity, activeItemOpacity.value]
      ),
      transform: [
        {
          scale: interpolate(
            progress,
            [0, 1],
            [zeroProgressScale, activeItemScale.value]
          )
        }
      ]
      // ...itemsStyleOverride.value
    };
  });

  return (
    <AnimatedOnLayoutView
      {...rest}
      style={[styles.decoration, animatedStyle]}
    />
  );
}

const styles = StyleSheet.create({
  decoration: Platform.select<ViewStyle>({
    android: {
      elevation: 5
    },
    default: {},
    native: {
      shadowOffset: {
        height: 0,
        width: 0
      },
      shadowOpacity: 1,
      shadowRadius: 5
    }
  })
});
