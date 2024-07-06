import { ScrollView, StyleSheet } from 'react-native';

import { ExampleNavCard } from '@/components';
import { colors, spacing } from '@/theme';
import { ExamplesScreenRoute } from '@/types/navigation';

export default function ExamplesListScreen() {
  return (
    <ScrollView
      contentContainerStyle={styles.scrollViewContent}
      style={styles.scrollView}>
      <ExampleNavCard
        route={ExamplesScreenRoute.SortableGridExamples}
        title='Sortable Grid'
      />
      <ExampleNavCard
        route={ExamplesScreenRoute.SortableFlexExamples}
        title='Sortable Flex'
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: colors.background3,
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl
  },
  scrollViewContent: {
    gap: spacing.md
  }
});
