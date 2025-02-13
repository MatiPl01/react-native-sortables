import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, text } from '@/theme';

type DescriptionProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;

export default function Description({ children, style }: DescriptionProps) {
  return Array.isArray(children) ? (
    <View style={[styles.description, style]}>
      {children.map((paragraph, index) => {
        return (
          <Text
            key={index}
            style={[styles.text, !paragraph && { lineHeight: 1 }]}>
            {paragraph}
          </Text>
        );
      })}
    </View>
  ) : (
    <Text style={[styles.description, style]}>{children}</Text>
  );
}
const styles = StyleSheet.create({
  description: {
    gap: spacing.xs
  },
  text: {
    ...text.body1,
    color: colors.foreground3
  }
});
