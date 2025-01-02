import type { PropsWithChildren } from 'react';
import { StyleSheet, Text } from 'react-native';

import { spacing, text } from '@/theme';

import Group from './Group';

type OptionGroupProps = PropsWithChildren<{
  label: string;
  value?: string;
}>;

export default function OptionGroup({
  children,
  label,
  value
}: OptionGroupProps) {
  return (
    <Group style={styles.option} withMargin={false}>
      <Text>
        <Text style={text.label1}>{label}</Text>{' '}
        {value && <Text style={text.subHeading3}>({value})</Text>}
      </Text>
      {children}
    </Group>
  );
}

const styles = StyleSheet.create({
  option: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    marginHorizontal: spacing.sm,
    marginTop: spacing.sm
  }
});
