import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useNavigation } from '@react-navigation/native';
import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors, radius, spacing, text } from '@/theme';

type RouteCardProps = PropsWithChildren<{
  title: string;
  route: string;
}>;

export type RouteCardComponent = (
  props: Omit<RouteCardProps, 'children'>
) => JSX.Element;

export default function RouteCard({ children, route, title }: RouteCardProps) {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      activeOpacity={0.5}
      style={styles.card}
      onPress={() => {
        navigation.navigate(route as never);
      }}>
      {children}
      <View style={styles.footer}>
        <Text style={[text.label1, styles.title]}>{title}</Text>
        <FontAwesomeIcon color={colors.foreground3} icon={faChevronRight} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background1,
    borderRadius: radius.md,
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  title: {
    color: colors.foreground1
  }
});
