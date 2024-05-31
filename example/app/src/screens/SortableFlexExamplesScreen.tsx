import { StyleSheet, Text, View } from 'react-native';
import { SortableFlex } from '@lib';
import { spacing } from '../theme';

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
  wrapper: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.lg
  },
  cellContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    rowGap: 2,
    columnGap: 5
  },
  cell: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginHorizontal: 3,
    marginVertical: 2,
    backgroundColor: '#FFA500',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cellText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5
  }
});
