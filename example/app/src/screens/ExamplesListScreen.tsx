import { ScrollView, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme';
import { ExampleNavCard } from '../components';
import { ExamplesScreenRoute } from '../types/navigation';

export default function ExamplesListScreen() {
  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollViewContent}>
      <ExampleNavCard
        title='Sortable Grid'
        route={ExamplesScreenRoute.SortableGridExamples}
      />
      <ExampleNavCard
        title='Sortable Flex'
        route={ExamplesScreenRoute.SortableFlexExamples}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    backgroundColor: colors.background3
  },
  scrollViewContent: {
    gap: spacing.md
  }
});
