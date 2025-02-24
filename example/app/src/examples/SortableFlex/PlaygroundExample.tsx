import { StyleSheet, Text, View } from 'react-native';
import Sortable from 'react-native-sortables';

import { ScrollScreen } from '@/components';
import { colors, text } from '@/theme';
import { getCategories, IS_WEB } from '@/utils';

const DATA = getCategories(IS_WEB ? 30 : 10);

export default function Flex() {
  return (
    <ScrollScreen includeNavBarHeight>
      <Sortable.Flex gap={10} padding={10}>
        {/* You can render anything within the Sortable.Flex component */}
        {DATA.map(item => (
          <View key={item} style={styles.cell}>
            <Text style={styles.text}>{item}</Text>
          </View>
        ))}
      </Sortable.Flex>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  cell: {
    alignItems: 'center',
    backgroundColor: '#36877F',
    borderRadius: 9999,
    justifyContent: 'center',
    padding: 10
  },
  text: {
    ...text.label2,
    color: colors.white
  }
});
