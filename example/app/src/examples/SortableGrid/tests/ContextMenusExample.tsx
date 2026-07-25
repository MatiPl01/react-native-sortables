import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Sortable from 'react-native-sortables';

import { ScrollScreen } from '@/components';
import { colors, radius, spacing } from '@/theme';

import ContextMenuExample from './ContextMenuExample';
import ContextMenuViewExample from './ContextMenuViewExample';

// Two ways to attach a native iOS context menu to sortable grid items, one per
// tab. They behave the same on a long press; the difference is the library.
const TABS = [
  {
    Content: ContextMenuExample,
    key: 'menu',
    label: '@react-native-menu/menu'
  },
  {
    Content: ContextMenuViewExample,
    key: 'view',
    label: 'react-native-context-menu-view'
  }
];

export default function ContextMenusExample() {
  const [activeKey, setActiveKey] = useState(TABS[0]!.key);
  const ActiveContent = (TABS.find(tab => tab.key === activeKey) ?? TABS[0]!)
    .Content;

  return (
    <ScrollScreen includeNavBarHeight>
      <View style={styles.tabBar}>
        {TABS.map(({ key, label }) => {
          const active = key === activeKey;
          return (
            <Pressable
              key={key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setActiveKey(key)}>
              <Text
                numberOfLines={1}
                style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {/* SortableLayer lets the dragged item render above the sections. */}
      <Sortable.Layer>
        <ActiveContent />
      </Sortable.Layer>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  tab: {
    alignItems: 'center',
    backgroundColor: colors.background3,
    borderRadius: radius.sm,
    flex: 1,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm
  },
  tabActive: {
    backgroundColor: colors.primary
  },
  tabBar: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md
  },
  tabLabel: {
    color: colors.foreground2,
    fontSize: 12,
    fontWeight: '600'
  },
  tabLabelActive: {
    color: colors.background1
  }
});
