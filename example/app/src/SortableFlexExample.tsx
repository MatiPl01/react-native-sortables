import { StyleSheet, Text, View } from 'react-native';
import { SortableFlex } from '@lib';

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
].slice(0, 5);

export default function SortableFlexExample() {
  return (
    <SortableFlex style={styles.cellContainer}>
      {DEFAULT_CATEGORIES.map((category, i) => (
        <View
          key={category}
          style={[
            styles.cell,
            { minHeight: [40, 94, 69, 70, 50, 71, 59, 58, 58, 81][i] }
          ]}>
          <Text style={styles.cellText}>{category}</Text>
        </View>
      ))}
    </SortableFlex>
  );
}

const styles = StyleSheet.create({
  cellContainer: {
    flexDirection: 'column',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    alignContent: 'space-between',
    justifyContent: 'flex-end',
    height: 200,
    backgroundColor: '#ddd',
    gap: 5
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
