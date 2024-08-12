import { View } from 'react-native';

import { TabView } from '@/components';

export default function AutoScrollExample() {
  return (
    <TabView>
      <TabView.Tab name='ScrollView'>
        <View style={{ backgroundColor: 'red', flex: 1 }} />
      </TabView.Tab>
      <TabView.Tab name='FlatList'>
        <View style={{ backgroundColor: 'blue', flex: 1 }} />
      </TabView.Tab>
      <TabView.Tab name='FlashList'>
        <View style={{ backgroundColor: 'green', flex: 1 }} />
      </TabView.Tab>
    </TabView>
  );
}
