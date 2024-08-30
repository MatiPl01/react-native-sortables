import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { colors, radius, spacing, text } from '@/theme';
import { lighten } from '@/utils';

type ButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function Button({
  disabled,
  onPress,
  style,
  title
}: ButtonProps) {
  return (
    <TouchableOpacity
      disabled={disabled}
      style={[styles.button, disabled && styles.disabled, style]}
      onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  disabled: {
    backgroundColor: lighten(colors.primary, 25)
  },
  text: {
    ...text.label2,
    color: colors.white
  }
});
