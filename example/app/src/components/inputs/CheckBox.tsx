import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  LinearTransition,
  useAnimatedStyle,
  useDerivedValue,
  withTiming
} from 'react-native-reanimated';

import { colors, iconSizes, radius, sizes, spacing, text } from '@/theme';

type CheckboxProps = {
  selected: boolean;
  label?: string;
  onChange: (selected: boolean) => void;
};

export default function CheckBox({ label, onChange, selected }: CheckboxProps) {
  const backgroundAnimationProgress = useDerivedValue(() =>
    withTiming(+selected, { duration: 150 })
  );
  const checkmarkAnimationProgress = useDerivedValue(() =>
    withTiming(+selected, {
      duration: 200,
      easing: Easing.bezier(0.52, 1.78, 0.99, 1.45).factory()
    })
  );

  const animatedBackgroundStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      backgroundAnimationProgress.value,
      [0, 1],
      [colors.background3, colors.primary]
    )
  }));

  const animatedCheckmarkStyle = useAnimatedStyle(() => ({
    opacity: checkmarkAnimationProgress.value,
    transform: [{ scale: checkmarkAnimationProgress.value }]
  }));

  return (
    <Animated.View layout={LinearTransition} style={styles.container}>
      <Pressable style={styles.checkboxRow} onPress={() => onChange(!selected)}>
        <Animated.View style={[styles.checkbox, animatedBackgroundStyle]}>
          <Animated.View style={animatedCheckmarkStyle}>
            <FontAwesomeIcon
              color={colors.white}
              icon={faCheck}
              size={iconSizes.xs}
            />
          </Animated.View>
        </Animated.View>
        {label && <Text style={text.label3}>{label}</Text>}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  checkbox: {
    alignItems: 'center',
    backgroundColor: colors.background3,
    borderRadius: radius.xs,
    height: sizes.xxs,
    justifyContent: 'center',
    width: sizes.xxs
  },
  checkboxRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs
  },
  container: {
    alignItems: 'flex-start'
  }
});
