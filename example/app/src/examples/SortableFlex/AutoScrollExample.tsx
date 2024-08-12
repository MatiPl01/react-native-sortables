import { useState } from 'react';

import { TabSelector } from '@/components';

const tabs = ['ScrollView', 'FlatList', 'FlashList'] as const;

export default function AutoScrollExample() {
  const [selectedTab, setSelectedTab] = useState<(typeof tabs)[number]>(
    tabs[0]
  );

  return (
    <TabSelector
      selectedTab={selectedTab}
      tabs={tabs}
      onSelectTab={setSelectedTab}
    />
  );
}
