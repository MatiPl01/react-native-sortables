import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/theme';

import Group from './Group';

type SectionProps = PropsWithChildren<{
  title: string;
  description?: string;
}>;

export default function Section({
  children,
  description,
  title
}: SectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.textWrapper}>
        <Text style={styles.title}>{title}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
      <Group>{children}</Group>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    gap: spacing.xxs,
    marginTop: spacing.md
  },
  description: {
    color: colors.foreground3,
    fontSize: 14
  },
  textWrapper: {
    gap: spacing.xs,
    marginHorizontal: spacing.sm
  },
  title: {
    color: colors.foreground1,
    fontSize: 16,
    fontWeight: 'bold'
  }
});
