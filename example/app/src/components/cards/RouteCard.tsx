import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useNavigation } from '@react-navigation/native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors, radius, spacing, text } from '@/theme';

type RouteCardProps = {
  title: string;
  route: string;
};

export default function RouteCard({ route, title }: RouteCardProps) {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      activeOpacity={0.5}
      style={styles.card}
      onPress={() => {
        navigation.navigate(route as never);
      }}>
      <View style={styles.cardContent}>
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
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  cardContent: {
    alignItems: 'center',
    flexDirection: 'row',
    flexGrow: 1,
    justifyContent: 'space-between'
  },
  title: {
    color: colors.foreground1
  }
});
