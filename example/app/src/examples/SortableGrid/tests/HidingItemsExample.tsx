import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SortableGridRenderItem } from 'react-native-sortables';
import Sortable from 'react-native-sortables';

import { ScrollScreen } from '@/components';
import { colors, radius, sizes, spacing, text } from '@/theme';

const DATA = Array.from({ length: 6 }, (_, index) => `Item ${index + 1}`);

export default function HidingItemsExample() {
  const [data, setData] = useState(DATA);

  const [isEditable, setIsEditable] = useState(true);
  const [collapsed, setCollapsed] = useState(true);

  const renderItem = useCallback<SortableGridRenderItem<string>>(
    ({ item }) => (
      <View style={styles.card}>
        <Text style={styles.text}>{item}</Text>
      </View>
    ),
    []
  );

  useEffect(() => {
    if (!collapsed) {
      setIsEditable(true);
    }
  }, [collapsed]);

  return (
    <ScrollScreen contentContainerStyle={styles.container} includeNavBarHeight>
      <Sortable.Grid
        columnGap={10}
        columns={2}
        data={collapsed ? data.slice(0, 4) : data}
        dimensionsAnimationType='worklet'
        renderItem={renderItem}
        rowGap={10}
        sortEnabled={isEditable}
        onDragEnd={({ fromIndex, toIndex }) => {
          setData(prev => {
            const newData = [...prev];
            const [removed] = newData.splice(fromIndex, 1);
            newData.splice(toIndex, 0, removed!);
            return newData;
          });
        }}
      />
      <Pressable onPress={() => setCollapsed(!collapsed)}>
        <Text style={styles.expandText}>
          {collapsed ? 'Expand' : 'Collapse'}
        </Text>
      </Pressable>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: '#36877F',
    borderRadius: radius.md,
    height: sizes.xl,
    justifyContent: 'center'
  },
  container: {
    padding: spacing.md
  },
  expandText: {
    ...text.label1,
    color: colors.primary,
    marginTop: spacing.md,
    textAlign: 'center'
  },
  text: {
    ...text.label2,
    color: colors.white
  }
});
