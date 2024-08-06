import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

type FlexCellProps = PropsWithChildren<{
  active?: boolean;
}>;

export default function FlexCell({ active, children }: FlexCellProps) {
  return (
    <View style={[styles.cell, active && styles.activeCell]}>
      {typeof children === 'string' ? (
        <Text style={styles.cellText}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  activeCell: {
    backgroundColor: colors.secondary
  },
  cell: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  cellText: {
    color: colors.background1,
    fontSize: 12,
    fontWeight: 'bold'
  }
});
