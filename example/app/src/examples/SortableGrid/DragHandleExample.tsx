import { faGripVertical } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import type { SortableGridRenderItem } from 'react-native-sortables';
import Sortable from 'react-native-sortables';

import { TabSelector } from '@/components';
import { colors, flex, radius, sizes, spacing, style, text } from '@/theme';

const COLUMNS = ['1', '2', '3', '4'];
const DATA = Array.from({ length: 20 }, (_, index) => `Item ${index + 1}`);

export default function DragHandleExample() {
  const [columns, setColumns] = useState(1);
  const scrollableRef = useAnimatedRef<Animated.ScrollView>();

  const handleSelectTab = useCallback((tab: string) => {
    setColumns(+tab);
  }, []);

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
    <>
      <View style={styles.columnSelector}>
        <Text style={styles.columnSelectorTitle}>Columns</Text>
        <TabSelector
          selectedTab={columns.toString()}
          tabs={COLUMNS}
          onSelectTab={handleSelectTab}
        />
      </View>
      <Animated.ScrollView
        contentContainerStyle={[style.contentContainer, styles.container]}
        ref={scrollableRef}
        style={flex.fill}>
        <Sortable.Grid
          activeItemScale={1}
          allowOverDrag={false}
          columnGap={10}
          columns={columns}
          data={DATA}
          dragActivationDelay={0}
          renderItem={renderItem}
          rowGap={10}
          scrollableRef={scrollableRef}
          customHandle
        />
      </Animated.ScrollView>
    </>
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
  columnSelector: {
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md
  },
  columnSelectorTitle: {
    ...text.label2,
    color: colors.foreground3,
    fontSize: 16,
    fontWeight: 'bold'
  },
  container: {
    padding: spacing.md
  },
  text: {
    ...text.label2,
    color: colors.white
  }
});
