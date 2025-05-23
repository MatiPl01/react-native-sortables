import { memo, useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import Sortable from 'react-native-sortables';

import {
  Button,
  FlexCell,
  Group,
  Screen,
  Section,
  Stagger
} from '@/components';
import { IS_WEB } from '@/constants';
import { colors, flex, spacing } from '@/theme';
import { getCategories } from '@/utils';

const AVAILABLE_DATA = getCategories(IS_WEB ? 30 : 15);

export default function DataChangeExample() {
  const scrollableRef = useAnimatedRef<Animated.ScrollView>();
  const [data, setData] = useState(() =>
    AVAILABLE_DATA.slice(0, AVAILABLE_DATA.length - 5)
  );

  const getNewItemName = useCallback((currentData: Array<string>) => {
    if (currentData.length >= AVAILABLE_DATA.length) {
      return null;
    }
    for (const item of AVAILABLE_DATA) {
      if (!currentData.includes(item)) {
        return item;
      }
    }
    return null;
  }, []);

  const prependItem = useCallback(() => {
    setData(prevData => {
      const newItem = getNewItemName(prevData);
      if (newItem) {
        return [newItem, ...prevData];
      }
      return prevData;
    });
  }, [getNewItemName]);

  const insertItem = useCallback(() => {
    setData(prevData => {
      const newItem = getNewItemName(prevData);
      if (newItem) {
        const index = Math.floor(Math.random() * (prevData.length - 1));
        return [...prevData.slice(0, index), newItem, ...prevData.slice(index)];
      }
      return prevData;
    });
  }, [getNewItemName]);

  const appendItem = useCallback(() => {
    setData(prevData => {
      const newItem = getNewItemName(prevData);
      if (newItem) {
        return [...prevData, newItem];
      }
      return prevData;
    });
  }, [getNewItemName]);

  const shuffleItems = useCallback(() => {
    setData(prevData => {
      const shuffledData = [...prevData];
      for (let i = shuffledData.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledData[i], shuffledData[j]] = [
          shuffledData[j]!,
          shuffledData[i]!
        ];
      }
      return shuffledData;
    });
  }, []);

  const sortItems = useCallback(() => {
    setData(prevData => [...prevData].sort());
  }, []);

  const onRemoveItem = useCallback((item: string) => {
    setData(prevData => prevData.filter(i => i !== item));
  }, []);

  const additionDisabled = data.length >= AVAILABLE_DATA.length;
  const reorderDisabled = data.length < 2;

  const menuSections = [
    {
      buttons: [
        { disabled: additionDisabled, onPress: prependItem, title: 'Prepend' },
        { disabled: additionDisabled, onPress: insertItem, title: 'Insert' },
        { disabled: additionDisabled, onPress: appendItem, title: 'Append' }
      ],
      description: 'Prepend/Insert/Append items to the list',
      title: 'Modify number of items'
    },
    {
      buttons: [
        { disabled: reorderDisabled, onPress: shuffleItems, title: 'Shuffle' },
        { disabled: reorderDisabled, onPress: sortItems, title: 'Sort' }
      ],
      description: 'Reorder items in the list',
      title: 'Change order of items'
    }
  ];

  return (
    <Screen includeNavBarHeight>
      {/* Need to set flex: 1 for the ScrollView parent component in order
      to ensure that it occupies the entire available space */}
      <Stagger
        wrapperStye={index =>
          index === 2 ? (IS_WEB ? flex.shrink : flex.fill) : {}
        }>
        {menuSections.map(({ buttons, description, title }) => (
          <Section description={description} key={title} title={title}>
            <View style={styles.row}>
              {buttons.map(btnProps => (
                <Button {...btnProps} key={btnProps.title} />
              ))}
            </View>
          </Section>
        ))}

        <Group padding='none' style={[flex.fill, styles.scrollViewGroup]}>
          <Animated.ScrollView
            contentContainerStyle={styles.scrollViewContent}
            ref={scrollableRef}
            // @ts-expect-error - overflowY is needed for proper behavior on web
            style={[flex.fill, IS_WEB && { overflowY: 'scroll' }]}>
            <Group withMargin={false} bordered center>
              <Text style={styles.title}>Above Sortable.Flex</Text>
            </Group>

            <Sortable.Flex
              columnGap={spacing.sm}
              dimensionsAnimationType='worklet'
              rowGap={spacing.xs}
              scrollableRef={scrollableRef}
              hapticsEnabled
              onDragEnd={({ order }) => setData(order(data))}>
              {data.map(item => (
                <FlexItem item={item} key={item} onRemoveItem={onRemoveItem} />
              ))}
            </Sortable.Flex>

            <Group withMargin={false} bordered center>
              <Text style={styles.title}>Below Sortable.Flex</Text>
            </Group>
          </Animated.ScrollView>
        </Group>
      </Stagger>
    </Screen>
  );
}

type FlexItemProps = {
  item: string;
  onRemoveItem: (item: string) => void;
};

// It is recommended to use memo for items to prevent re-renders of all flex items
// when the parent component re-renders
const FlexItem = memo(function FlexItem({ item, onRemoveItem }: FlexItemProps) {
  return (
    <Sortable.Touchable key={item} onTap={onRemoveItem.bind(null, item)}>
      <FlexCell size='large'>{item}</FlexCell>
    </Sortable.Touchable>
  );
});

const styles = StyleSheet.create({
  row: {
    columnGap: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.xs
  },
  scrollViewContent: {
    gap: spacing.sm,
    padding: spacing.sm
  },
  scrollViewGroup: {
    overflow: 'hidden',
    paddingHorizontal: spacing.none,
    paddingVertical: spacing.none
  },
  title: {
    color: colors.foreground3,
    fontSize: 16,
    fontWeight: 'bold'
  }
});
