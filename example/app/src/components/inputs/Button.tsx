import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { colors, radius, spacing } from '@/theme';
import { lighten } from '@/utils';

type ButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
};

export default function Button({ disabled, onPress, title }: ButtonProps) {
  return (
    <TouchableOpacity
      disabled={disabled}
      style={[styles.button, disabled && styles.disabled]}
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
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold'
  }
});
