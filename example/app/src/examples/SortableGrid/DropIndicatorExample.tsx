import { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import type {
  DropIndicatorComponentProps,
  SortableGridRenderItem
} from 'react-native-sortable';
import { SortableGrid } from 'react-native-sortable';

import { GridCard, Section } from '@/components';
import { getItems } from '@/utils';

const DATA = getItems(8);
const COLUMNS = 4;

function CustomDropIndicator({
  activationProgress,
  dropIndex,
  touchedItemKey
}: DropIndicatorComponentProps) {
  const indexes = useMemo(
    () => Array.from({ length: DATA.length }, (_, i) => i),
    []
  );
  const colors = useMemo(
    () =>
      new Array(DATA.length).fill(null).map((_, i) => {
        const hue = (360 / DATA.length) * i;
        return `hsl(${hue}, 100%, 50%)`;
      }),
    []
  );

  const scale = useSharedValue(0);
  const colorIndex = useSharedValue(0);
  const showIndicator = useDerivedValue(
    () => activationProgress.value > 0.2 && touchedItemKey.value !== null
  );

  useAnimatedReaction(
    () => ({
      index: dropIndex.value,
      show: showIndicator.value
    }),
    ({ index, show }, prev) => {
      if (show !== prev?.show) {
        scale.value = withSpring(+show);
      } else if (index !== prev?.index) {
        colorIndex.value = withTiming(index % DATA.length);
        scale.value = withSequence(
          withTiming(0.75, { duration: 100 }),
          withSpring(1)
        );
      }
    }
  );

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(colorIndex.value, indexes, colors),
    transform: [{ scale: scale.value }]
  }));

  return <Animated.View style={[styles.customIndicator, animatedStyle]} />;
}

export default function DropIndicatorExample() {
  const renderItem = useCallback<SortableGridRenderItem<string>>(
    ({ item }) => <GridCard>{item}</GridCard>,
    []
  );

  return (
    <ScrollView>
      <Section title='Without drop indicator'>
        <SortableGrid
          columnGap={6}
          columns={COLUMNS}
          data={DATA}
          renderItem={renderItem}
          rowGap={6}
        />
      </Section>

      <Section title='With default drop indicator'>
        <SortableGrid
          columnGap={6}
          columns={COLUMNS}
          data={DATA}
          renderItem={renderItem}
          rowGap={6}
          showDropIndicator
        />
      </Section>

      <Section
        description='Looks better without inactive item opacity, so inactiveItemOpacity is set to 1 in this example'
        title='With custom drop indicator'>
        <SortableGrid
          columnGap={6}
          columns={COLUMNS}
          data={DATA}
          DropIndicatorComponent={CustomDropIndicator}
          inactiveItemOpacity={1}
          renderItem={renderItem}
          rowGap={6}
          showDropIndicator
        />
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  customIndicator: {
    borderRadius: 10,
    borderWidth: 2,
    flex: 1
  }
});
