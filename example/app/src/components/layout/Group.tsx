import { type PropsWithChildren, useMemo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

export type GroupProps = PropsWithChildren<{
  bordered?: boolean;
  padding?: 'all' | 'horizontal' | 'none' | 'vertical' | number;
  withMargin?: boolean;
  center?: boolean;
  style?: StyleProp<ViewStyle>;
}>;

export default function Group({
  bordered,
  center,
  children,
  padding,
  style,
  withMargin = true
}: GroupProps) {
  const paddingStyle = useMemo(() => {
    if (padding === 'all') return { padding: spacing.sm };
    if (padding === 'horizontal') return { paddingHorizontal: spacing.sm };
    if (padding === 'vertical') return { paddingVertical: spacing.sm };
    if (padding === 'none') return { padding: 0 };
    return { padding };
  }, [padding]);

  return (
    <View
      style={[
        styles.group,
        bordered && styles.bordered,
        center && styles.center,
        withMargin && styles.margin,
        paddingStyle,
        style
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  bordered: {
    borderColor: colors.foreground3,
    borderRadius: radius.md,
    borderStyle: 'dashed',
    borderWidth: 1
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  group: {
    backgroundColor: colors.background1,
    borderRadius: radius.md
  },
  margin: {
    marginHorizontal: spacing.sm,
    marginVertical: spacing.sm
  }
});
