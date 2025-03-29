import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withTiming
} from 'react-native-reanimated';

import { colors, radius, sizes, spacing, text } from '@/theme';
import { lighten } from '@/utils';

type SwitchOption<V> = { label: string; value: V };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SwitchOptions<V = any> = [SwitchOption<V>, SwitchOption<V>];

const selectedColor = lighten(colors.primary, 40);

type SwitchProps<V> = {
  options: SwitchOptions<V>;
  value: V;
  onChange: (value: V) => void;
};

export default function Switch<V>({
  onChange,
  options,
  value
}: SwitchProps<V>) {
  const isSelected = value === options[1].value;
  const progress = useDerivedValue(() => withTiming(+isSelected));

  const animatedTrackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.background3, selectedColor]
    )
  }));

  const animatedThumbStyle = useAnimatedStyle(() => ({
    left: `${progress.value * 100}%`,
    transform: [{ translateX: `${-progress.value * 100}%` }]
  }));

  return (
    <View style={styles.container}>
      <Pressable onPress={() => onChange(options[0].value)}>
        <Text style={styles.label}>{options[0].label}</Text>
      </Pressable>
      <Pressable onPress={() => onChange(options[+!isSelected]!.value)}>
        <Animated.View style={[styles.track, animatedTrackStyle]}>
          <Animated.View style={[styles.thumb, animatedThumbStyle]} />
        </Animated.View>
      </Pressable>
      <Pressable onPress={() => onChange(options[1].value)}>
        <Text style={styles.label}>{options[1].label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xxs
  },
  label: {
    ...text.label3,
    paddingHorizontal: spacing.xxs,
    textTransform: 'uppercase'
  },
  thumb: {
    aspectRatio: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    height: '100%'
  },
  track: {
    backgroundColor: colors.background3,
    borderRadius: radius.full,
    height: sizes.xxs,
    padding: spacing.xxxs,
    width: sizes.sm
  }
});
