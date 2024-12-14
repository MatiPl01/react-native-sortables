/* eslint-disable react-native/no-unused-styles */
import type { PropsWithChildren } from 'react';
import type { TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

type FlexCellProps = PropsWithChildren<{
  active?: boolean;
  height?: number;
  size?: 'large' | 'small';
}>;

export default function FlexCell({
  active,
  children,
  height,
  size = 'small'
}: FlexCellProps) {
  let cellSizeStyles: { cell: ViewStyle; cellText: TextStyle };
  switch (size) {
    case 'large':
      cellSizeStyles = largeCellStyles;
      break;
    default:
    case 'small':
      cellSizeStyles = smallCellStyles;
      break;
  }

  return (
    <View
      style={[
        sharedCellStyles.cell,
        cellSizeStyles.cell,
        active && sharedCellStyles.activeCell,
        { height },
        { height: Math.random() * 100 + 40 }
      ]}>
      {typeof children === 'string' ? (
        <Text style={[sharedCellStyles.cellText, cellSizeStyles.cellText]}>
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}

const sharedCellStyles = StyleSheet.create({
  activeCell: {
    backgroundColor: colors.secondary
  },
  cell: {
    backgroundColor: colors.primary,
    borderRadius: radius.full
  },
  cellText: {
    color: colors.background1,
    fontWeight: 'bold'
  }
});

const smallCellStyles = StyleSheet.create({
  cell: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  cellText: {
    fontSize: 12
  }
});

const largeCellStyles = StyleSheet.create({
  cell: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  cellText: {
    fontSize: 14
  }
});
