import type { PropsWithChildren } from 'react';
import type { ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

type GroupProps = PropsWithChildren<{
  style?: ViewStyle;
}>;

export default function Group({ children, style }: GroupProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.group, style]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm
  },
  group: {
    alignItems: 'center',
    backgroundColor: colors.background1,
    borderRadius: radius.md,
    justifyContent: 'center',

    padding: spacing.sm
  }
});
