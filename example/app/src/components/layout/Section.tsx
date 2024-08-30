import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, flex, spacing } from '@/theme';

import Group from './Group';

type SectionProps = PropsWithChildren<{
  title: string;
  description?: string;
  fill?: boolean;
}>;

export default function Section({
  children,
  description,
  fill,
  title
}: SectionProps) {
  return (
    <View style={[styles.container, fill && flex.fill]}>
      <View style={styles.textWrapper}>
        <Text style={styles.title}>{title}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
      {children && <Group style={fill && flex.fill}>{children}</Group>}
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
