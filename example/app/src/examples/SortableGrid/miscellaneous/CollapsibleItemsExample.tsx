import { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  LinearTransition,
  useAnimatedRef
} from 'react-native-reanimated';
import type { SortableGridRenderItem } from 'react-native-sortables';
import Sortable from 'react-native-sortables';

import { Screen } from '@/components';
import { IS_WEB } from '@/constants';
import { colors, radius, sizes, spacing, style, text } from '@/theme';

const DATA = Array.from({ length: 5 }, (_, index) => `Item ${index + 1}`);

export default function CollapsibleItemsExample() {
  const [collapsed, setCollapsed] = useState(false);
  const scrollableRef = useAnimatedRef<Animated.ScrollView>();

  // TODO - fix portal case
  const renderItem = useCallback<SortableGridRenderItem<string>>(
    ({ item }) => (
      <Animated.View
        layout={LinearTransition.delay(40)}
        style={[styles.card, { height: collapsed ? sizes.lg : sizes.xxxl }]}>
        <Animated.Text layout={LinearTransition.delay(40)} style={styles.text}>
          {item}
        </Animated.Text>
      </Animated.View>
    ),
    [collapsed]
  );

  return (
    <Screen>
      <Animated.ScrollView
        contentContainerStyle={[styles.container, IS_WEB && style.webContent]}
        ref={scrollableRef}>
        <Sortable.Grid
          activeItemScale={1.05}
          columnGap={10}
          data={DATA}
          overDrag='vertical'
          // overflow='visible'
          renderItem={renderItem}
          reorderTriggerOrigin='center'
          rowGap={10}
          scrollableRef={scrollableRef} // TODO - add correct auto scroll support for collapsible items
          debug
          onActiveItemDropped={() => setCollapsed(false)}
          onDragStart={() => setCollapsed(true)}
        />
      </Animated.ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: '#36877F',
    borderRadius: radius.md,
    height: sizes.xl,
    justifyContent: 'center'
  },
  container: {
    padding: spacing.md,
    paddingBottom: 120
  },
  text: {
    ...text.label2,
    color: colors.white
  }
});
