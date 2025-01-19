import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Sortable from 'react-native-sortable';

import { colors, radius, spacing, text } from '@/theme';
import { getCategories } from '@/utils';

const DATA = getCategories(20);

export default function PlaygroundExample() {
  return (
    <SafeAreaView style={styles.container}>
      <Sortable.Flex columnGap={spacing.sm} rowGap={spacing.xs}>
        {DATA.map(item => (
          <View key={item} style={styles.card}>
            <Text style={styles.text}>{item}</Text>
          </View>
        ))}
      </Sortable.Flex>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: '#36877F',
    borderRadius: radius.full,
    justifyContent: 'center',
    padding: spacing.md
  },
  container: {
    padding: spacing.md
  },
  text: {
    ...text.label2,
    color: colors.white
  }
});
