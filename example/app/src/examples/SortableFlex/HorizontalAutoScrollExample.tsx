import type { FlashList } from '@shopify/flash-list';
import { View } from 'react-native';
import type { AnimatedRef } from 'react-native-reanimated';
import Animated, {
  LinearTransition,
  useAnimatedRef
} from 'react-native-reanimated';
import Sortable from 'react-native-sortables';

import { FlexCell, TabView } from '@/components';
import { spacing } from '@/theme';
import { getCategories, IS_WEB } from '@/utils';

const MANY_CATEGORIES = getCategories(IS_WEB ? 30 : 20);
const FEW_CATEGORIES = getCategories(IS_WEB ? 12 : 6);

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
      <View style={{ backgroundColor: 'red', height: 200, width: 200 }} />
      {/* <ScrollView
        ref={scrollableRef}
        style={{ backgroundColor: 'blue', maxHeight: 200 }}
        contentContainerStyle={[
          style.contentContainer,
          { backgroundColor: 'yellow', maxHeight: 150, maxWidth: 400 }
        ]}
        horizontal> */}
      <View
        style={{
          backgroundColor: 'blue',
          flex: 0,
          flexDirection: 'row',
          flexShrink: 1,
          height: 100
        }}>
        <SortableFlex scrollableRef={scrollableRef} />
      </View>
      {/* </ScrollView> */}
      <View style={{ backgroundColor: 'green', height: 200, width: 200 }} />
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
  if (true) {
    return (
      <View
        style={{
          alignContent: 'flex-start',
          alignItems: 'flex-start',
          columnGap: 12,
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 0,
          justifyContent: 'flex-start',
          padding: 0,
          rowGap: 8
        }}>
        {MANY_CATEGORIES.map(item => (
          <Animated.View key={item} layout={LinearTransition}>
            <FlexCell size='large'>{item}</FlexCell>
          </Animated.View>
        ))}
      </View>
    );
  }

  return (
    <Sortable.Flex
      columnGap={spacing.sm}
      flexDirection='row'
      flexWrap='nowrap'
      rowGap={spacing.xs}
      scrollableRef={scrollableRef}>
      {MANY_CATEGORIES.map(item => (
        <FlexCell key={item} size='large'>
          {item}
        </FlexCell>
      ))}
    </Sortable.Flex>
  );
}
