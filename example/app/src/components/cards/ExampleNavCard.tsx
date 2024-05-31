import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, radius, spacing, text } from '../../theme';
import { ExamplesScreenRoute, useAppNavigation } from '../../types/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';

type ExampleCardProps = {
  title: string;
  preview: React.ReactNode;
  route: ExamplesScreenRoute;
};

export default function ExampleNavCard({
  title,
  preview,
  route
}: ExampleCardProps) {
  const navigation = useAppNavigation();

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.5}
      onPress={() => {
        navigation.navigate(route);
      }}>
      <Text style={text.label1}>{title}</Text>
      <FontAwesomeIcon icon={faChevronRight} color={colors.foreground3} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background1,
    borderRadius: radius.md,
    flexDirection: 'row',
    justifyContent: 'space-between'
  }
});
