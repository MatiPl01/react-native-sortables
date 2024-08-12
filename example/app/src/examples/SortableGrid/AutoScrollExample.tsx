import type { FlashList } from '@shopify/flash-list';
import { AnimatedFlashList } from '@shopify/flash-list';
import { StyleSheet, Text } from 'react-native';
import type { AnimatedRef } from 'react-native-reanimated';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import { SortableGrid } from 'react-native-sortable';

import { GridCard, Group, Section, TabView } from '@/components';
import { colors, spacing } from '@/theme';
import { getItems } from '@/utils';

const MANY_ITEMS = getItems(21);
const FEW_ITEMS = getItems(6);

const LIST_ITEM_SECTIONS = ['List item 1', 'List item 2', 'List item 3'];

export default function AutoScrollExample() {
  return (
    <TabView>
      <TabView.Tab name='ScrollView'>
        <ScrollViewExample />
      </TabView.Tab>
      <TabView.Tab name='FlatList'>
        <FlatListExample />
      </TabView.Tab>
      <TabView.Tab name='FlashList'>
        <FlashListExample />
      </TabView.Tab>
    </TabView>
  );
}

function ScrollViewExample() {
  const scrollableRef = useAnimatedRef<Animated.ScrollView>();

  return (
    <Animated.ScrollView
      ref={scrollableRef}
      removeClippedSubviews={false}
      style={styles.scrollable}>
      <Group>
        <ManyCards scrollableRef={scrollableRef} />
      </Group>
      <SeparatorSection />
      <Group>
        <FewCards scrollableRef={scrollableRef} />
      </Group>
      <SeparatorSection />
      <Group>
        <ManyCards scrollableRef={scrollableRef} />
      </Group>
    </Animated.ScrollView>
  );
}

function FlatListExample() {
  const scrollableRef = useAnimatedRef<Animated.FlatList<string>>();

  return (
    <Animated.FlatList
      data={LIST_ITEM_SECTIONS}
      ref={scrollableRef}
      ListFooterComponent={
        <Section title='List footer'>
          <ManyCards scrollableRef={scrollableRef} />
        </Section>
      }
      ListHeaderComponent={
        <Section title='List header'>
          <ManyCards scrollableRef={scrollableRef} />
        </Section>
      }
      renderItem={({ item }) => (
        <Section title={item}>
          <FewCards scrollableRef={scrollableRef} />
        </Section>
      )}
    />
  );
}

function FlashListExample() {
  const scrollableRef = useAnimatedRef<FlashList<string>>();

  return (
    <AnimatedFlashList
      data={LIST_ITEM_SECTIONS}
      estimatedItemSize={275}
      ref={scrollableRef}
      ListFooterComponent={
        <Section title='List footer'>
          <ManyCards scrollableRef={scrollableRef} />
        </Section>
      }
      ListHeaderComponent={
        <Section title='List header'>
          <ManyCards scrollableRef={scrollableRef} />
        </Section>
      }
      renderItem={({ item }: { item: string }) => (
        <Section title={item}>
          <FewCards scrollableRef={scrollableRef} />
        </Section>
      )}
    />
  );
}

type CardsSectionProps = {
  scrollableRef: // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | AnimatedRef<Animated.FlatList<any>>
    | AnimatedRef<Animated.ScrollView>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | AnimatedRef<FlashList<any>>;
};

function ManyCards({ scrollableRef }: CardsSectionProps) {
  return (
    <SortableGrid
      columnGap={spacing.sm}
      columns={3}
      data={MANY_ITEMS}
      renderItem={({ item }) => <GridCard>{item}</GridCard>}
      rowGap={spacing.xs}
      scrollableRef={scrollableRef}
    />
  );
}

function FewCards({ scrollableRef }: CardsSectionProps) {
  return (
    <SortableGrid
      columnGap={spacing.sm}
      columns={3}
      data={FEW_ITEMS}
      renderItem={({ item }) => <GridCard>{item}</GridCard>}
      rowGap={spacing.xs}
      scrollableRef={scrollableRef}
    />
  );
}

function SeparatorSection() {
  return (
    <Group style={styles.section}>
      <Text style={styles.title}>Between SortableGrid components</Text>
    </Group>
  );
}

const styles = StyleSheet.create({
  scrollable: {
    overflow: 'visible'
  },
  section: {
    alignItems: 'center',
    height: 100,
    justifyContent: 'center'
  },
  title: {
    color: colors.foreground3,
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 24,
    textAlign: 'center'
  }
});
