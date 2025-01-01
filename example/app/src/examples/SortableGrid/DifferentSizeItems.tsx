import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { SortableGridRenderItem } from 'react-native-sortable';
import Sortable from 'react-native-sortable';

import { Button, GridCard, Group, Stagger } from '@/components';
import { colors, flex, sizes, spacing, style, text } from '@/theme';
import { getItems } from '@/utils';

const DATA = getItems(12);
const COLUMNS = 4;

const ORDERING_STRATEGIES = ['insert', 'swap'] as const;

export default function DifferentSizeItems() {
  const [strategyIndex, setStrategyIndex] = useState(0);

  const renderItem = useCallback<SortableGridRenderItem<string>>(
    ({ item }) => <GridCard>{item}</GridCard>,
    []
  );

  const strategy = ORDERING_STRATEGIES[strategyIndex];

  return (
    <View style={[flex.fill, style.contentContainer]}>
      <Stagger>
        <Group style={styles.option} withMargin={false}>
          <Text>
            <Text style={text.label1}>Ordering Strategy</Text>{' '}
            <Text style={text.subHeading3}>({strategy})</Text>
          </Text>
          <Button
            style={styles.button}
            title={strategy ?? ''}
            onPress={() =>
              setStrategyIndex(prev => (prev + 1) % ORDERING_STRATEGIES.length)
            }
          />
        </Group>

        <Text style={styles.title}>With &quot;{strategy}&quot; strategy</Text>
        <Group style={styles.scrollViewGroup}>
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <Sortable.Grid
              columnGap={spacing.xs}
              columns={COLUMNS}
              data={DATA}
              renderItem={renderItem}
              rowGap={spacing.xs}
              strategy={strategy}
              animateHeight
            />
          </ScrollView>
        </Group>
      </Stagger>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    width: sizes.xl
  },
  option: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: spacing.sm,
    marginTop: spacing.sm
  },
  scrollViewContent: {
    gap: spacing.sm,
    padding: spacing.sm
  },
  scrollViewGroup: {
    overflow: 'hidden',
    paddingHorizontal: spacing.none,
    paddingVertical: spacing.none
  },
  title: {
    color: colors.foreground1,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: spacing.sm,
    marginTop: spacing.md
  }
});
