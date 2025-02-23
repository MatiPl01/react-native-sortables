import { useCallback } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import type { SortableGridRenderItem } from 'react-native-sortables';
import Sortable from 'react-native-sortables';

import { GridCard, Group, ScrollScreen, Section } from '@/components';
import { MAX_CONTENT_WIDTH } from '@/constants';
import { spacing, text } from '@/theme';
import { IS_WEB } from '@/utils';

const DATA = Array.from({ length: 18 }, (_, index) => `Item ${index + 1}`);

// Horizontal grid
const ROWS = 3;
const ROW_HEIGHT = 75;

// Vertical grid
const SCREEN_WIDTH = Dimensions.get('window').width;
const VERTICAL_GRID_WIDTH = 1.1 * Math.min(SCREEN_WIDTH, MAX_CONTENT_WIDTH);
const COLUMNS = 4;

const getRandomWidth = () => 50 + Math.random() * (IS_WEB ? 175 : 100);

export default function HorizontalAutoScrollExample() {
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
        <Group padding='none'>
          <HorizontalSameSizeItems />
        </Group>
        <Group padding='none'>
          <HorizontalDifferentSizeItems />
        </Group>
      </Section>

      <Section
        padding='none'
        title='Vertical grid'
        description={[
          'Vertical grid requires the following props to be set:',
          '- `columns` - number of columns to render'
        ]}>
        <VerticalSameSizeItems />
      </Section>
    </ScrollScreen>
  );
}

function HorizontalSameSizeItems() {
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
    <>
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
          debug
        />
      </Animated.ScrollView>
    </>
  );
}

function HorizontalDifferentSizeItems() {
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
    <>
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
          debug
        />
      </Animated.ScrollView>
    </>
  );
}

function VerticalSameSizeItems() {
  const scrollableRef = useAnimatedRef<Animated.ScrollView>();

  const renderItem = useCallback<SortableGridRenderItem<string>>(
    ({ item }) => <GridCard>{item}</GridCard>,
    []
  );
  return (
    <>
      <Text style={styles.subTitle}>Different width items</Text>
      <Animated.ScrollView
        contentContainerStyle={styles.container}
        ref={scrollableRef}
        horizontal>
        <View style={styles.verticalContainer}>
          <Sortable.Grid
            autoScrollDirection='horizontal'
            columnGap={10}
            columns={COLUMNS}
            data={DATA}
            renderItem={renderItem}
            rowGap={10}
            scrollableRef={scrollableRef}
          />
        </View>
      </Animated.ScrollView>
    </>
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
  },
  verticalContainer: {
    width: VERTICAL_GRID_WIDTH
  }
});
