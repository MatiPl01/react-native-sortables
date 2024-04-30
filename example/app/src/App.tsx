import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';
import { SortableView } from '@lib';

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
  'fashion',
]

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <SortableView style={styles.cellContainer}>
          {DEFAULT_CATEGORIES.map(category => (
            <View key={category} style={styles.cell}>
              <Text style={styles.cellText}>{category}</Text>
            </View>
          ))}
        </SortableView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  cellContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  cell: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginHorizontal: 3,
    marginVertical: 2,
    backgroundColor: '#FFA500',
    borderRadius: 25
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
