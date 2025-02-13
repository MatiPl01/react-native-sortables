import type { FlashList } from '@shopify/flash-list';
import type { AnimatedRef } from 'react-native-reanimated';
import Animated, {
  LinearTransition,
  useAnimatedRef
} from 'react-native-reanimated';
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
  console.log(scrollableRef); // TODO - add support for horizontal scroll

  return (
    <Sortable.Flex flexWrap='nowrap' gap={spacing.xs} padding={spacing.md}>
      {MANY_CATEGORIES.map(item => (
        <Animated.View key={item} layout={LinearTransition}>
          <FlexCell size='large'>{item}</FlexCell>
        </Animated.View>
      ))}
    </Sortable.Flex>
  );
}
