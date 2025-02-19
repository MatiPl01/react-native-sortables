import { Dimensions, StyleSheet } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import Sortable from 'react-native-sortables';

import { FlexCell, ScrollScreen, Section } from '@/components';
import { getCategories, IS_WEB } from '@/utils';

import { spacing } from '../../../theme/spacing';

const SCREEN_WIDTH = Dimensions.get('window').width;
const MANY_CATEGORIES_FLEX_WIDTH = 1.5 * Math.min(SCREEN_WIDTH, 600);

const FEW_CATEGORIES = getCategories(10);
const MANY_CATEGORIES = getCategories(IS_WEB ? 30 : 20);

export default function HorizontalAutoScrollExample() {
  return (
    <ScrollScreen includeNavBarHeight>
      <NoWrapExample />
      <WrapExample />
    </ScrollScreen>
  );
}

function NoWrapExample() {
  const scrollableRef = useAnimatedRef<Animated.ScrollView>();

  return (
    <Section
      padding='none'
      title='Without wrapping'
      description={[
        '- renders all items in a single row',
        '- it is recommended to use set `flexWrap` to `nowrap` to properly resize container when items are removed or added'
      ]}>
      <Animated.ScrollView
        contentContainerStyle={styles.container}
        ref={scrollableRef}
        horizontal>
        <Sortable.Flex
          autoScrollActivationOffset={100}
          autoScrollDirection='horizontal'
          autoScrollSpeed={0.4}
          flexWrap='nowrap'
          gap={spacing.xs}
          overDrag='horizontal'
          scrollableRef={scrollableRef}>
          {FEW_CATEGORIES.map(item => (
            <FlexCell key={item} size='large'>
              {item}
            </FlexCell>
          ))}
        </Sortable.Flex>
      </Animated.ScrollView>
    </Section>
  );
}

function WrapExample() {
  const scrollableRef = useAnimatedRef<Animated.ScrollView>();

  return (
    <Section
      padding='none'
      title='With wrapping'
      description={[
        '- renders items in multiple rows',
        '- width must be set explicitly when used in the horizontal scrollable to wrap items',
        '- if no specific width is set, items will be rendered in a single row but the row size will not change when items are removed or added'
      ]}>
      <Animated.ScrollView
        contentContainerStyle={styles.container}
        ref={scrollableRef}
        horizontal>
        <Sortable.Flex
          autoScrollDirection='horizontal'
          gap={spacing.xs}
          scrollableRef={scrollableRef}
          width={MANY_CATEGORIES_FLEX_WIDTH}>
          {MANY_CATEGORIES.map(item => (
            <FlexCell key={item} size='large'>
              {item}
            </FlexCell>
          ))}
        </Sortable.Flex>
      </Animated.ScrollView>
    </Section>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg
  }
});
