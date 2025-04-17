import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import type {
  SortableGridDragEndCallback,
  SortableGridRenderItem
} from 'react-native-sortables';
import Sortable from 'react-native-sortables';

import { ScrollScreen } from '@/components';
import { colors, iconSizes, radius, sizes, spacing, text } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const MAX_ITEMS = 15;
let nextId = MAX_ITEMS + 1;

const DATA = Array.from(
  { length: MAX_ITEMS - 3 },
  (_, index) => `Item ${index + 1}`
);

export default function StaggerAnimationExample() {
  const isFirstRenderRef = useRef(true); // to disable stagger after first render
  const [data, setData] = useState(DATA);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      // will set to false after the first render is completed
      isFirstRenderRef.current = false;
      return;
    }
  }, []);

  const handleDragEnd = useCallback<SortableGridDragEndCallback<string>>(
    props => {
      setData(props.data);
    },
    []
  );

  const handleRemove = useCallback((item: string) => {
    setData(prev => prev.filter(i => i !== item));
  }, []);

  const handleAdd = useCallback(() => {
    setData(prev => [...prev, `Item ${nextId++}`]);
  }, []);

  const renderItem = useCallback<SortableGridRenderItem<string>>(
    ({ index, item }) => (
      <Animated.View
        entering={
          isFirstRenderRef.current ? FadeInDown.delay(index * 50) : undefined
        }>
        <GridItem item={item} onRemove={handleRemove} />
      </Animated.View>
    ),
    [handleRemove]
  );

  return (
    <ScrollScreen contentContainerStyle={styles.container} includeNavBarHeight>
      <Sortable.Grid
        columnGap={10}
        columns={3}
        data={data}
        overflow='visible'
        renderItem={renderItem}
        rowGap={10}
        dimensionsAnimationType='worklet'
        onDragEnd={handleDragEnd}
      />

      {/* Add item button */}
      {data.length < MAX_ITEMS && (
        <AnimatedPressable
          entering={FadeInDown}
          exiting={FadeOutDown}
          style={styles.button}
          onPress={handleAdd}>
          <FontAwesomeIcon
            color={colors.primary}
            icon={faPlus}
            size={iconSizes.sm}
          />
          <Text style={styles.buttonText}>Add item</Text>
        </AnimatedPressable>
      )}
    </ScrollScreen>
  );
}

type GridItemProps = {
  item: string;
  onRemove: (item: string) => void;
};

const GridItem = memo(function GridItem({ item, onRemove }: GridItemProps) {
  return (
    <Sortable.Pressable onPress={() => onRemove(item)}>
      <View style={styles.card}>
        <Text style={styles.text}>{item}</Text>
      </View>
    </Sortable.Pressable>
  );
});

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xxs,
    marginTop: spacing.md
  },
  buttonText: {
    ...text.label1,
    color: colors.primary
  },
  card: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: sizes.xl,
    justifyContent: 'center'
  },
  container: {
    alignItems: 'center',
    padding: spacing.md
  },
  text: {
    ...text.label2,
    color: colors.white
  }
});
