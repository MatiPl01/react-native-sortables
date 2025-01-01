import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/theme';

type GridCardProps = PropsWithChildren<{
  active?: boolean;
  height?: number;
}>;

export default function GridCard({ active, children, height }: GridCardProps) {
  return (
    <View
      style={[
        styles.card,
        active && styles.activeCard,
        height !== undefined ? { aspectRatio: undefined, height } : {}
      ]}>
      {typeof children === 'string' ? (
        <Text style={styles.text}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  activeCard: {
    backgroundColor: colors.secondary
  },
  card: {
    alignItems: 'center',
    aspectRatio: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    justifyContent: 'center'
  },
  text: {
    color: colors.background1,
    fontSize: 12,
    fontWeight: 'bold'
  }
});
