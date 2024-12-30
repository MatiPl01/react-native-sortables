import { AnimatedFlashList, type FlashList } from '@shopify/flash-list';
import { FlatList, StyleSheet, Text } from 'react-native';
import type { AnimatedRef } from 'react-native-reanimated';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import Sortable from 'react-native-sortable';

import { FlexCell, Group, Section, TabView } from '@/components';
import { colors, spacing } from '@/theme';
import { getCategories } from '@/utils';

const MANY_CATEGORIES = getCategories(20);
const FEW_CATEGORIES = getCategories(6);

const LIST_ITEM_SECTIONS = ['List item 1', 'List item 2', 'List item 3'];

const AnimatedFlatList = Animated.createAnimatedComponent(
  FlatList
) as typeof FlatList;

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
    <Animated.ScrollView ref={scrollableRef} removeClippedSubviews={false}>
      <Sortable.Layer>
        <Group>
          <ManyCategories scrollableRef={scrollableRef} />
        </Group>
      </Sortable.Layer>
      <SeparatorSection />
      <Sortable.Layer>
        <Group>
          <FewCategories scrollableRef={scrollableRef} />
        </Group>
      </Sortable.Layer>
      <SeparatorSection />
      <Sortable.Layer>
        <Group>
          <ManyCategories scrollableRef={scrollableRef} />
        </Group>
      </Sortable.Layer>
    </Animated.ScrollView>
  );
}

function FlatListExample() {
  const scrollableRef = useAnimatedRef<Animated.FlatList<string>>();

  return (
    <AnimatedFlatList
      data={LIST_ITEM_SECTIONS}
      ListHeaderComponentStyle={styles.foreground}
      CellRendererComponent={Sortable.Layer}
      ref={scrollableRef}
      ListFooterComponent={
        <Section title='List footer'>
          <ManyCategories scrollableRef={scrollableRef} />
        </Section>
      }
      ListHeaderComponent={
        <Section title='List header'>
          <ManyCategories scrollableRef={scrollableRef} />
        </Section>
      }
      renderItem={({ item }) => (
        <Section title={item}>
          <FewCategories scrollableRef={scrollableRef} />
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
      estimatedItemSize={152}
      ref={scrollableRef}
      ListFooterComponent={
        <Section title='List footer'>
          <ManyCategories scrollableRef={scrollableRef} />
        </Section>
      }
      ListHeaderComponent={
        <Section title='List header'>
          <ManyCategories scrollableRef={scrollableRef} />
        </Section>
      }
      renderItem={({ item }: { item: string }) => (
        <Section title={item}>
          <FewCategories scrollableRef={scrollableRef} />
        </Section>
      )}
    />
  );
}

type CategoriesSectionProps = {
  scrollableRef: // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | AnimatedRef<Animated.FlatList<any>>
    | AnimatedRef<Animated.ScrollView>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | AnimatedRef<FlashList<any>>;
};

function ManyCategories({ scrollableRef }: CategoriesSectionProps) {
  return (
    <Sortable.Flex scrollableRef={scrollableRef} style={styles.sortableFlex}>
      {MANY_CATEGORIES.map(item => (
        <FlexCell key={item} size='large'>
          {item}
        </FlexCell>
      ))}
    </Sortable.Flex>
  );
}

function FewCategories({ scrollableRef }: CategoriesSectionProps) {
  return (
    <Sortable.Flex scrollableRef={scrollableRef} style={styles.sortableFlex}>
      {FEW_CATEGORIES.map(item => (
        <FlexCell key={item} size='large'>
          {item}
        </FlexCell>
      ))}
    </Sortable.Flex>
  );
}

function SeparatorSection() {
  return (
    <Group style={styles.section}>
      <Text style={styles.title}>Between SortableFlex components</Text>
    </Group>
  );
}

const styles = StyleSheet.create({
  foreground: {
    zIndex: 1
  },
  section: {
    alignItems: 'center',
    height: 100,
    justifyContent: 'center'
  },
  sortableFlex: {
    columnGap: spacing.sm,
    rowGap: spacing.xs
  },
  title: {
    color: colors.foreground3,
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 24,
    textAlign: 'center'
  }
});
