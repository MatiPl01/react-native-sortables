import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

type GroupProps = PropsWithChildren<{
  borderStyle?: 'dashed' | 'dotted' | 'solid';
}>;

export default function Group({
  borderStyle = 'dashed',
  children
}: GroupProps) {
  return <View style={[styles.border, { borderStyle }]}>{children}</View>;
}

const styles = StyleSheet.create({
  border: {
    alignItems: 'center',
    borderColor: colors.foreground1,
    borderRadius: radius.md,
    borderStyle: 'dashed',
    borderWidth: 1,
    justifyContent: 'center',
    marginHorizontal: spacing.sm,
    marginVertical: spacing.sm,
    padding: spacing.sm
  }
});
