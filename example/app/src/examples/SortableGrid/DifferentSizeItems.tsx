import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import type { SortableGridRenderItem } from 'react-native-sortable';
import Sortable from 'react-native-sortable';

import { Button, GridCard, Group, Stagger } from '@/components';
import { colors, flex, sizes, spacing, style, text } from '@/theme';
import { getItems } from '@/utils';

const DATA = getItems(16);
const COLUMNS = 4;

const ORDERING_STRATEGIES = ['insert', 'swap'] as const;

export default function DifferentSizeItems() {
  const scrollableRef = useAnimatedRef<Animated.ScrollView>();
  const [counter, setCounter] = useState(0);
  const [strategyIndex, setStrategyIndex] = useState(0);

  const renderItem = useCallback<SortableGridRenderItem<string>>(
    ({ item }) => (
      <GridCard height={50 + Math.random() * 100} key={counter}>
        {item}
      </GridCard>
    ),
    [counter]
  );

  const strategy = ORDERING_STRATEGIES[strategyIndex];

  return (
    <View style={[flex.fill, style.contentContainer]}>
      <Stagger wrapperStye={index => (index === 3 ? flex.fill : {})}>
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

        <Group style={styles.option} withMargin={false}>
          <Text>
            <Text style={text.label1}>Randomize heights</Text>{' '}
          </Text>
          <Button
            style={styles.button}
            title='random'
            onPress={() => setCounter(prev => prev + 1)}
          />
        </Group>

        <Text style={styles.title}>With &quot;{strategy}&quot; strategy</Text>

        <Group style={[flex.fill, styles.scrollViewGroup]}>
          <Animated.ScrollView
            contentContainerStyle={styles.scrollViewContent}
            ref={scrollableRef}
            style={flex.fill}>
            <Sortable.Grid
              columnGap={spacing.xs}
              columns={COLUMNS}
              data={DATA}
              renderItem={renderItem}
              rowGap={spacing.xs}
              scrollableRef={scrollableRef}
              strategy={strategy}
            />
          </Animated.ScrollView>
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
