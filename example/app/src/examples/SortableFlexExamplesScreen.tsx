import { StyleSheet, Text, View } from 'react-native';
import { SortableFlex } from 'react-native-sortable';

import { spacing } from '@/theme';

const DEFAULT_CATEGORIES = [
  'sports',
  'entertainment',
  'technology',
  'science',
  'health',
  'business',
  'mental health',
  'music',
  'food',
  'travel',
  'fashion'
];

export default function SortableFlexExamplesScreen() {
  return (
    <View style={styles.wrapper}>
      <SortableFlex style={styles.cellContainer}>
        {DEFAULT_CATEGORIES.map(category => (
          <View key={category} style={styles.cell}>
            <Text style={styles.cellText}>{category}</Text>
          </View>
        ))}
      </SortableFlex>
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    alignItems: 'center',
    backgroundColor: '#FFA500',
    borderRadius: 25,
    justifyContent: 'center',
    marginHorizontal: 3,
    marginVertical: 2,
    paddingHorizontal: 15,
    paddingVertical: 10
  },
  cellContainer: {
    columnGap: 5,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    rowGap: 2
  },
  cellText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { height: 1, width: -1 },
    textShadowRadius: 5
  },
  wrapper: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.lg
  }
});
