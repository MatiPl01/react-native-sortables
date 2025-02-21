import { useCallback } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import type { SortableGridRenderItem } from 'react-native-sortables';
import Sortable from 'react-native-sortables';

import { GridCard, Group, ScrollScreen, Section } from '@/components';
import { spacing, text } from '@/theme';
import { IS_WEB } from '@/utils';

const DATA = Array.from({ length: 18 }, (_, index) => `Item ${index + 1}`);
const ROWS = 3;
const ROW_HEIGHT = 75;

const getRandomWidth = () => 50 + Math.random() * (IS_WEB ? 175 : 100);

export default function PlaygroundExample() {
  return (
    <ScrollScreen includeNavBarHeight>
      <Section
        group={false}
        title='Horizontal grid'
        description={[
          'Horizontal grid requires the following props to be set:',
          '- `rows` - number of rows to render',
          '- `rowHeight` - height of each row'
        ]}>
        <SameSizeItems />
        <DifferentSizeItems />
      </Section>
    </ScrollScreen>
  );
}

function SameSizeItems() {
  const scrollableRef = useAnimatedRef<Animated.ScrollView>();

  const renderItem = useCallback<SortableGridRenderItem<string>>(
    ({ item }) => (
      <GridCard height='100%' width={100}>
        {item}
      </GridCard>
    ),
    []
  );

  return (
    <Group padding='none'>
      <Text style={styles.subTitle}>Same width items</Text>
      <Animated.ScrollView
        contentContainerStyle={styles.container}
        ref={scrollableRef}
        horizontal>
        <Sortable.Grid
          autoScrollDirection='horizontal'
          columnGap={10}
          data={DATA}
          renderItem={renderItem}
          rowGap={10}
          rowHeight={ROW_HEIGHT}
          rows={ROWS}
          scrollableRef={scrollableRef}
        />
      </Animated.ScrollView>
    </Group>
  );
}

function DifferentSizeItems() {
  const scrollableRef = useAnimatedRef<Animated.ScrollView>();

  const renderItem = useCallback<SortableGridRenderItem<string>>(
    ({ item }) => (
      <GridCard height='100%' width={getRandomWidth()}>
        {item}
      </GridCard>
    ),
    []
  );

  return (
    <Group padding='none'>
      <Text style={styles.subTitle}>Different width items</Text>
      <Animated.ScrollView
        contentContainerStyle={styles.container}
        ref={scrollableRef}
        horizontal>
        <Sortable.Grid
          autoScrollDirection='horizontal'
          columnGap={10}
          data={DATA}
          renderItem={renderItem}
          rowGap={10}
          rowHeight={ROW_HEIGHT}
          rows={ROWS}
          scrollableRef={scrollableRef}
        />
      </Animated.ScrollView>
    </Group>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md
  },
  subTitle: {
    ...text.subHeading2,
    marginLeft: spacing.md,
    marginTop: spacing.sm
  }
});
