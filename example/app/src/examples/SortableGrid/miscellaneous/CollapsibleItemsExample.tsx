import { useCallback, useState } from 'react';
import type { ViewStyle } from 'react-native';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  LinearTransition,
  useAnimatedRef
} from 'react-native-reanimated';
import type { SortableGridRenderItem } from 'react-native-sortables';
import Sortable from 'react-native-sortables';

import { Group, Screen, Section } from '@/components';
import { IS_WEB } from '@/constants';
import { colors, radius, sizes, spacing, style, text } from '@/theme';

const DATA = Array.from({ length: 15 }, (_, index) => `Item ${index + 1}`);

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
    ({ item }) => {
      const layoutTransition = LinearTransition.delay(collapsed ? 0 : 50);

      return (
        <Animated.View
          layout={layoutTransition}
          style={[
            styles.card,
            { [dimension]: collapsed ? sizes.lg : sizes.xxxl }
          ]}>
          <Animated.Text layout={layoutTransition} style={styles.text}>
            {item}
          </Animated.Text>
        </Animated.View>
      );
    },
    [collapsed, dimension]
  );

  const props = horizontal
    ? ({
        autoScrollDirection: 'horizontal',
        columnGap: 10,
        overDrag: 'horizontal',
        rowHeight: sizes.xl,
        rows: 1
      } as const)
    : ({
        overDrag: 'vertical',
        rowGap: 10
      } as const);

  const groupStyle: ViewStyle = horizontal
    ? { height: sizes.xl, width: sizes.xxl }
    : { height: sizes.xl };

  return (
    <Animated.ScrollView
      contentContainerStyle={[styles.container, IS_WEB && style.webContent]}
      horizontal={horizontal}
      ref={scrollableRef}>
      <Group style={groupStyle} withMargin={false} bordered center>
        <Text style={styles.title}>Before Collapsible Items</Text>
      </Group>

      <Sortable.Grid
        {...props}
        activeItemScale={1.05}
        autoScrollMaxVelocity={750}
        data={DATA}
        dimensionsAnimationType='worklet'
        overflow='visible'
        renderItem={renderItem}
        scrollableRef={scrollableRef}
        autoAdjustOffsetDuringDrag
        onActiveItemDropped={() => {
          setCollapsed(false);
        }}
        onDragStart={() => {
          setCollapsed(true);
        }}
      />

      <Group style={groupStyle} withMargin={false} bordered center>
        <Text style={styles.title}>After Collapsible Items</Text>
      </Group>
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
    gap: spacing.md,
    padding: spacing.md
  },
  text: {
    ...text.label2,
    color: colors.white
  },
  title: {
    ...text.subHeading2
  }
});
