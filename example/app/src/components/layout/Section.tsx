import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

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
}>;

export default function Section({
  children,
  description,
  fill,
  group = true,
  padding,
  title
}: SectionProps) {
  return (
    <View style={[styles.container, fill && flex.fill]}>
      <View style={styles.textWrapper}>
        <Text style={styles.title}>{title}</Text>
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
    </View>
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
  }
});
