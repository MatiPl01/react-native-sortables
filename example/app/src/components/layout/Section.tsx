import type { PropsWithChildren, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { colors, flex, spacing } from '@/theme';

import Description from './Description';
import type { GroupProps } from './Group';
import Group from './Group';

type SectionProps = PropsWithChildren<{
  title: string;
  description?: Array<string> | string;
  fill?: boolean;
  padding?: GroupProps['padding'];
  group?: boolean;
  titleRight?: ReactNode;
  noOverflow?: boolean;
}>;

export default function Section({
  children,
  description,
  fill,
  group = true,
  noOverflow,
  padding,
  title,
  titleRight
}: SectionProps) {
  return (
    <Animated.View
      layout={LinearTransition}
      style={[
        styles.container,
        fill && flex.fill,
        noOverflow && { overflow: 'hidden' }
      ]}>
      <View style={styles.textWrapper}>
        {titleRight ? (
          <View style={styles.titleWrapper}>
            <Text style={styles.title}>{title}</Text>
            {titleRight}
          </View>
        ) : (
          <Text style={styles.title}>{title}</Text>
        )}
        {description && <Description>{description}</Description>}
      </View>
      {children &&
        (group ? (
          <Group padding={padding} style={[fill && flex.fill]}>
            {children}
          </Group>
        ) : (
          children
        ))}
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  container: {
    gap: spacing.xxs,
    marginTop: spacing.md
  },
  textWrapper: {
    gap: spacing.xs,
    marginHorizontal: spacing.sm
  },
  title: {
    color: colors.foreground1,
    fontSize: 16,
    fontWeight: 'bold'
  },
  titleWrapper: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm
  }
});
