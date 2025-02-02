import { useMemo } from 'react';
import type { ScrollViewProps } from 'react-native';
import { ScrollView, StyleSheet } from 'react-native';

import { flex, spacing, style } from '@/theme';

export type ScrollProps = {
  fill?: boolean;
  noPadding?: boolean;
  gap?: number;
  rowGap?: number;
} & Omit<ScrollViewProps, 'gap' | 'rowGap'>;

export default function Scroll({
  children,
  contentContainerStyle,
  fill = true,
  horizontal,
  noPadding = false,
  style: customStyle,
  ...rest
}: ScrollProps) {
  const flattenedStyle = useMemo(
    () => StyleSheet.flatten(contentContainerStyle),
    [contentContainerStyle]
  );
  const gap = +(flattenedStyle?.gap ?? flattenedStyle?.rowGap ?? spacing.xxs);

  return (
    <ScrollView
      horizontal={horizontal}
      removeClippedSubviews={false}
      showsVerticalScrollIndicator={false}
      style={[style.visible, fill && flex.fill, customStyle]}
      contentContainerStyle={[
        style.visible,
        styles.scrollViewContentWeb,
        { gap },
        noPadding
          ? {}
          : { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
        contentContainerStyle
      ]}
      {...rest}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollViewContentWeb: {
    marginHorizontal: 'auto',
    maxWidth: '100%',
    width: 600
  }
});
