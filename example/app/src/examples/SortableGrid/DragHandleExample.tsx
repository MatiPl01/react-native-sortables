import { faGripVertical } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { SortableGridRenderItem } from 'react-native-sortables';
import Sortable from 'react-native-sortables';

import { ScrollScreen } from '@/components';
import { colors, radius, sizes, spacing, text } from '@/theme';

const DATA = Array.from({ length: 10 }, (_, index) => `Item ${index + 1}`);

export default function DragHandleExample() {
  const renderItem = useCallback<SortableGridRenderItem<string>>(
    ({ item }) => (
      <View style={styles.card}>
        <Text style={styles.text}>{item}</Text>
        <Sortable.Handle>
          <FontAwesomeIcon color={colors.white} icon={faGripVertical} />
        </Sortable.Handle>
      </View>
    ),
    []
  );

  return (
    <ScrollScreen style={styles.container}>
      <Sortable.Grid
        activeItemScale={1}
        columnGap={10}
        columns={1}
        data={DATA}
        dragActivationDelay={0}
        renderItem={renderItem}
        rowGap={10}
        customHandle
      />
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: '#36877F',
    borderRadius: radius.md,
    flexDirection: 'row',
    height: sizes.lg,
    justifyContent: 'space-between',
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
