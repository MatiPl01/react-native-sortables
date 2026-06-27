import { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import Sortable from 'react-native-sortables';

import { Button, FlexCell, ScrollScreen, Section } from '@/components';
import { colors, radius, spacing } from '@/theme';

const NARROW_WIDTH = 170;
const WIDE_WIDTH = 320;
const RESIZE_DURATION = 600;

const ITEMS = [
  'Lorem',
  'ipsum',
  'dolor',
  'sit',
  'amet',
  'consectetur',
  'adipiscing',
  'elit'
];

export default function ResizableContainerExample() {
  const [isWide, setIsWide] = useState(true);
  // Keep separate order per container so dragging one does not affect the other.
  // Order must be synced in onDragEnd - in relative idle layout items follow
  // their order in the children, so this is required to persist a reorder.
  const [relativeItems, setRelativeItems] = useState(ITEMS);
  const [absoluteItems, setAbsoluteItems] = useState(ITEMS);
  const width = useSharedValue(WIDE_WIDTH);

  const toggleWidth = useCallback(() => {
    setIsWide(prev => {
      const next = !prev;
      width.value = withTiming(next ? WIDE_WIDTH : NARROW_WIDTH, {
        duration: RESIZE_DURATION
      });
      return next;
    });
  }, [width]);

  const containerStyle = useAnimatedStyle(() => ({ width: width.value }));

  return (
    <ScrollScreen includeNavBarHeight>
      <Section
        description='Animate the container width and compare how items behave while the sortable is idle.'
        title='Resize the container'>
        <Button
          title={isWide ? 'Make narrow' : 'Make wide'}
          onPress={toggleWidth}
        />
      </Section>

      <Section
        description="idleItemsLayout='relative' keeps idle items in flex layout, so they reflow together with the container."
        title='Relative (reflows immediately)'>
        <Animated.View style={[styles.column, containerStyle]}>
          <Sortable.Flex
            gap={spacing.xs}
            idleItemsLayout='relative'
            onDragEnd={({ order }) => setRelativeItems(order)}>
            {relativeItems.map(item => (
              <FlexCell key={item} size='large'>
                {item}
              </FlexCell>
            ))}
          </Sortable.Flex>
        </Animated.View>
      </Section>

      <Section
        description="idleItemsLayout='absolute' (the default) keeps the library-computed positions, so items lag behind the container while it resizes."
        title='Absolute (lags behind)'>
        <Animated.View style={[styles.column, containerStyle]}>
          <Sortable.Flex
            gap={spacing.xs}
            onDragEnd={({ order }) => setAbsoluteItems(order)}>
            {absoluteItems.map(item => (
              <FlexCell key={item} size='large'>
                {item}
              </FlexCell>
            ))}
          </Sortable.Flex>
        </Animated.View>
      </Section>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  column: {
    backgroundColor: colors.background3,
    borderRadius: radius.md,
    padding: spacing.xs
  }
});
