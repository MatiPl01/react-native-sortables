import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '../../theme';
import { ExamplesScreenRoute, useAppNavigation } from '../../types/navigation';

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
      <Text>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background1,
    borderRadius: radius.md
  }
});
