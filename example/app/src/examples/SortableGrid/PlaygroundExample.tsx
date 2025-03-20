import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { SortableGridRenderItem } from 'react-native-sortables';
import Sortable from 'react-native-sortables';

import { ScrollScreen } from '@/components';
import { colors, radius, sizes, spacing, text } from '@/theme';

const DATA = Array.from({ length: 12 }, (_, index) => `Item ${index + 1}`);

export default function PlaygroundExample() {
  const renderItem = useCallback<SortableGridRenderItem<string>>(
    ({ item, index }) => {
      const fixed =
        index === 0 || index === 4 || index === 9 || index === DATA.length - 1;
      return (
        <Sortable.Handle mode={fixed ? 'fixed' : 'draggable'}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: fixed ? colors.secondary : colors.primary
              }
            ]}>
            <Text style={styles.text}>{item}</Text>
          </View>
        </Sortable.Handle>
      );
    },
    []
  );

  return (
    <ScrollScreen contentContainerStyle={styles.container} includeNavBarHeight>
      <Sortable.Grid
        columnGap={10}
        columns={3}
        data={DATA}
        customHandle
        renderItem={renderItem}
        rowGap={10}
      />
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderRadius: radius.md,
    height: sizes.xl,
    justifyContent: 'center'
  },
  container: {
    padding: spacing.md
  },
  text: {
    ...text.label2,
    color: colors.white
  }
});
