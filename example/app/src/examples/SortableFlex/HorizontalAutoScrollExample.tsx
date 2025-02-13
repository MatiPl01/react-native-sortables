import type { FlashList } from '@shopify/flash-list';
import type { AnimatedRef } from 'react-native-reanimated';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import Sortable from 'react-native-sortables';

import { FlexCell, TabView } from '@/components';
import { getCategories, IS_WEB } from '@/utils';

import { spacing } from '../../theme/spacing';

const MANY_CATEGORIES = getCategories(IS_WEB ? 30 : 20);

export default function HorizontalAutoScrollExample() {
  return (
    <TabView>
      <TabView.Tab name='ScrollView'>
        <ScrollViewExample />
      </TabView.Tab>
    </TabView>
  );
}

function ScrollViewExample() {
  const scrollableRef = useAnimatedRef<Animated.ScrollView>();

  return (
    <>
      <Animated.ScrollView ref={scrollableRef} horizontal>
        <SortableFlex scrollableRef={scrollableRef} />
      </Animated.ScrollView>
    </>
  );
}

type SortableFlexProps = {
  scrollableRef: // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | AnimatedRef<Animated.FlatList<any>>
    | AnimatedRef<Animated.ScrollView>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | AnimatedRef<FlashList<any>>;
};

function SortableFlex({ scrollableRef }: SortableFlexProps) {
  return (
    <Sortable.Flex
      autoScrollDirection='horizontal'
      autoScrollSpeed={0.4}
      gap={spacing.xs}
      padding={spacing.md}
      scrollableRef={scrollableRef}>
      {MANY_CATEGORIES.map(item => (
        <FlexCell key={item} size='large'>
          {item}
        </FlexCell>
      ))}
    </Sortable.Flex>
  );
}
