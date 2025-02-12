import type { FlashList } from '@shopify/flash-list';
import { ScrollView, View } from 'react-native';
import type { AnimatedRef } from 'react-native-reanimated';
import Animated, {
  LinearTransition,
  useAnimatedRef
} from 'react-native-reanimated';
import Sortable from 'react-native-sortables';

import { FlexCell, TabView } from '@/components';
import { spacing, style } from '@/theme';
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
      <Sortable.Layer>
        <Animated.ScrollView
          ref={scrollableRef}
          style={{
            backgroundColor: 'blue',
            maxHeight: 200,
            overflow: 'visible'
          }}
          contentContainerStyle={[
            {
              backgroundColor: 'yellow'
            }
          ]}
          horizontal>
          <SortableFlex scrollableRef={scrollableRef} />
        </Animated.ScrollView>
      </Sortable.Layer>
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
  if (false) {
    return (
      <View
        style={{
          alignContent: 'flex-start',
          alignItems: 'flex-start',
          columnGap: 12,
          flexDirection: 'row',
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
      {...{
        alignContent: 'flex-start',
        alignItems: 'flex-start',
        columnGap: 12,
        flexWrap: 'nowrap',
        flexDirection: 'row',
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
    </Sortable.Flex>
  );
}
