import { useCallback, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import type { SortableGridRenderItem } from 'react-native-sortables';
import Sortable from 'react-native-sortables';

import {
  Button,
  GridCard,
  Group,
  OptionGroup,
  Screen,
  Stagger
} from '@/components';
import { colors, flex, sizes, spacing } from '@/theme';
import { getItems, IS_WEB } from '@/utils';

const DATA = getItems(16);
const COLUMNS = 4;

const ORDERING_STRATEGIES = ['insert', 'swap'] as const;

const getRandomHeight = () => 50 + Math.random() * (IS_WEB ? 175 : 100);

export default function DifferentSizeItems() {
  const scrollableRef = useAnimatedRef<Animated.ScrollView>();
  const [counter, setCounter] = useState(0);
  const [strategyIndex, setStrategyIndex] = useState(0);

  const renderItem = useCallback<SortableGridRenderItem<string>>(
    ({ item }) => (
      <GridCard height={getRandomHeight()} key={counter}>
        {item}
      </GridCard>
    ),
    [counter]
  );

  const strategy = ORDERING_STRATEGIES[strategyIndex];

  return (
    <Screen>
      <Stagger
        wrapperStye={index =>
          index === 3 ? (IS_WEB ? flex.shrink : flex.fill) : {}
        }>
        <OptionGroup label='Ordering Strategy' value={strategy ?? ''}>
          <Button
            style={styles.button}
            title={strategy ?? ''}
            onPress={() =>
              setStrategyIndex(prev => (prev + 1) % ORDERING_STRATEGIES.length)
            }
          />
        </OptionGroup>

        <OptionGroup label='Randomize heights'>
          <Button
            style={styles.button}
            title='random'
            onPress={() => setCounter(prev => prev + 1)}
          />
        </OptionGroup>

        <Text style={styles.title}>With &quot;{strategy}&quot; strategy</Text>

        <Group padding='none' style={[flex.fill, styles.scrollViewGroup]}>
          <Animated.ScrollView
            contentContainerStyle={styles.scrollViewContent}
            ref={scrollableRef}
            // @ts-expect-error - overflowY is needed for proper behavior on web
            style={[flex.fill, { overflowY: 'scroll' }]}>
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    width: sizes.xl
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
