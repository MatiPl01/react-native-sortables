import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing, text } from '../../theme';
import { ExamplesScreenRoute, useAppNavigation } from '../../types/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';

type ExampleCardProps = {
  title: string;
  route: ExamplesScreenRoute;
};

export default function ExampleNavCard({ title, route }: ExampleCardProps) {
  const navigation = useAppNavigation();

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.5}
      onPress={() => {
        navigation.navigate(route);
      }}>
      <View style={styles.cardContent}>
        <Text style={[text.label1, styles.title]}>{title}</Text>
        <FontAwesomeIcon icon={faChevronRight} color={colors.foreground3} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background1,
    borderRadius: radius.md,
    gap: spacing.md
  },
  cardContent: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  title: {
    color: colors.foreground1
  }
});
