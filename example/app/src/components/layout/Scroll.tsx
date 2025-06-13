import { useMemo } from 'react';
import type { ScrollViewProps } from 'react-native';
import { ScrollView, StyleSheet } from 'react-native';

import { IS_WEB } from '@/constants';
import { useBottomNavBarHeight } from '@/providers';
import { flex, spacing, style } from '@/theme';

import Spacer from './Spacer';

export type ScrollProps = Omit<ScrollViewProps, 'gap' | 'rowGap'> & {
  fill?: boolean;
  noPadding?: boolean;
  gap?: number;
  rowGap?: number;
  includeNavBarHeight?: boolean;
};

export default function Scroll({
  children,
  contentContainerStyle,
  fill = true,
  horizontal,
  includeNavBarHeight = false,
  noPadding = false,
  style: customStyle,
  ...rest
}: ScrollProps) {
  const bottomNavBarHeight = useBottomNavBarHeight();
  const flattenedStyle = useMemo(
    () => StyleSheet.flatten(contentContainerStyle),
    [contentContainerStyle]
  );
  const gap = +(flattenedStyle?.gap ?? flattenedStyle?.rowGap ?? spacing.xxs);

  return (
    <ScrollView
      horizontal={horizontal}
      removeClippedSubviews={false}
      style={[fill && flex.fill, customStyle]}
      contentContainerStyle={[
        IS_WEB && style.webContent,
        { gap },
        noPadding
          ? {}
          : { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
        contentContainerStyle
      ]}
      {...rest}>
      {children}
      {includeNavBarHeight && <Spacer height={bottomNavBarHeight} />}
    </ScrollView>
  );
}
