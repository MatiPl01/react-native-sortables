import { useMemo } from 'react';
import type { ScrollViewProps } from 'react-native';
import { ScrollView, StyleSheet } from 'react-native';

import { flex, spacing } from '@/theme';
import { IS_WEB } from '@/utils';

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
  style,
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
      showsVerticalScrollIndicator={false}
      style={[style, fill && flex.fill, styles.scrollView]}
      contentContainerStyle={[
        IS_WEB && !horizontal && styles.scrollViewContentWeb,
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
  scrollView: {
    overflow: 'visible'
  },
  scrollViewContentWeb: {
    marginHorizontal: 'auto',
    maxWidth: '100%',
    width: 600
  }
});
