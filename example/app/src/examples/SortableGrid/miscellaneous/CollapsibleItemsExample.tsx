import { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  LinearTransition,
  useAnimatedRef
} from 'react-native-reanimated';
import type { SortableGridRenderItem } from 'react-native-sortables';
import Sortable from 'react-native-sortables';

import { Screen, Section } from '@/components';
import { IS_WEB } from '@/constants';
import { colors, radius, sizes, spacing, style, text } from '@/theme';

const DATA = Array.from({ length: 20 }, (_, index) => `Item ${index + 1}`);

export default function CollapsibleItemsExample() {
  return (
    <Screen includeNavBarHeight>
      <Section
        description='With vertical auto-scroll'
        padding='none'
        title='Vertical'
        fill>
        <Example />
      </Section>
      <Section
        description='With horizontal auto-scroll '
        padding='none'
        title='Horizontal'>
        <Example horizontal />
      </Section>
    </Screen>
  );
}

type ExampleProps = {
  horizontal?: boolean;
};

function Example({ horizontal }: ExampleProps) {
  const [collapsed, setCollapsed] = useState(false);
  const scrollableRef = useAnimatedRef<Animated.ScrollView>();

  const dimension = horizontal ? 'width' : 'height';

  const renderItem = useCallback<SortableGridRenderItem<string>>(
    ({ item }) => (
      <Animated.View
        layout={LinearTransition}
        style={[
          styles.card,
          { [dimension]: collapsed ? sizes.lg : sizes.xxxl }
        ]}>
        <Animated.Text layout={LinearTransition} style={styles.text}>
          {item}
        </Animated.Text>
      </Animated.View>
    ),
    [collapsed, dimension]
  );

  const props = horizontal
    ? ({
        autoScrollDirection: 'horizontal',
        columnGap: 10,
        rowHeight: sizes.xl,
        rows: 1
      } as const)
    : {
        rowGap: 10
      };

  return (
    <Animated.ScrollView
      contentContainerStyle={[styles.container, IS_WEB && style.webContent]}
      horizontal={horizontal}
      ref={scrollableRef}>
      <Sortable.Grid
        {...props}
        activeItemScale={1.05}
        data={DATA}
        renderItem={renderItem}
        scrollableRef={scrollableRef}
        autoAdjustOffsetDuringDrag
        onActiveItemDropped={() => setCollapsed(false)}
        onDragStart={() => setCollapsed(true)}
      />
    </Animated.ScrollView>
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
    padding: spacing.md
  },
  text: {
    ...text.label2,
    color: colors.white
  }
});
