import { StyleSheet, Text, View } from 'react-native';
import Sortable from 'react-native-sortables';

import { ScrollScreen } from '@/components';
import { IS_WEB } from '@/constants';
import { colors, text } from '@/theme';
import { getCategories } from '@/utils';

const DATA = getCategories(IS_WEB ? 30 : 10);

const FIXED_ITEMS = ['history', 'sports', 'art'];

export default function Flex() {
  return (
    <ScrollScreen includeNavBarHeight>
      <Sortable.Flex gap={10} padding={10} customHandle>
        {/* You can render anything within the Sortable.Flex component */}
        {DATA.map(item => (
          <Sortable.Handle
            key={item}
            mode={FIXED_ITEMS.includes(item) ? 'fixed' : 'draggable'}>
            <View style={styles.cell}>
              <Text style={styles.text}>{item}</Text>
            </View>
          </Sortable.Handle>
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
