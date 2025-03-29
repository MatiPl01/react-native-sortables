import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { colors, radius, spacing, text } from '@/theme';
import { lighten } from '@/utils';

type ButtonVariant = 'big' | 'small';

const VARIANT_STYLES: Record<
  ButtonVariant,
  { text: TextStyle; button: ViewStyle }
> = {
  big: {
    button: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm
    },
    text: text.label2
  },
  small: {
    button: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs
    },
    text: text.label3
  }
};

type ButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  variant?: ButtonVariant;
};

export default function Button({
  disabled,
  onPress,
  style,
  title,
  variant = 'big'
}: ButtonProps) {
  const variantStyles = VARIANT_STYLES[variant];

  return (
    <TouchableOpacity
      disabled={disabled}
      style={[
        styles.button,
        disabled && styles.disabled,
        variantStyles.button,
        style
      ]}
      onPress={onPress}>
      <Text style={[styles.text, variantStyles.text]}>{title}</Text>
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
    color: colors.white
  }
});
