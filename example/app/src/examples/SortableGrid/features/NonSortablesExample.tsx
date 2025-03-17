import { memo, useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import Sortable, { type SortableGridRenderItem } from 'react-native-sortables';

import {
  Button,
  GridCard,
  Group,
  Screen,
  Section,
  Stagger
} from '@/components';
import { IS_WEB } from '@/constants';
import { colors, flex, spacing, text } from '@/theme';
import { getItems } from '@/utils';

type ItemType = {
  key: number;
  value: string;
  sortable: boolean;
};

const AVAILABLE_DATA: Array<ItemType> = getItems(18).map((item, index) => {
  return {
    key: index,
    sortable: index % 5 !== 0,
    value: item
  };
});
const COLUMNS = 4;

export default function NonSortablesExample() {
  const scrollableRef = useAnimatedRef<Animated.ScrollView>();
  const [data, setData] = useState<Array<ItemType>>(
    AVAILABLE_DATA.slice(0, 12)
  );

  const getNewItem = useCallback((currentData: Array<ItemType>) => {
    if (currentData.length >= AVAILABLE_DATA.length) {
      return null;
    }
    for (const item of AVAILABLE_DATA) {
      if (
        currentData.filter(dataItem => dataItem.key === item.key).length === 0
      ) {
        return item;
      }
    }
    return null;
  }, []);

  const prependItem = useCallback(() => {
    setData(prevData => {
      const newItem = getNewItem(prevData);
      if (newItem) {
        return [newItem, ...prevData];
      }
      return prevData;
    });
  }, [getNewItem]);

  const insertItem = useCallback(() => {
    setData(prevData => {
      const newItem = getNewItem(prevData);

      if (newItem) {
        const index = Math.floor(Math.random() * (prevData.length - 1));
        return [...prevData.slice(0, index), newItem, ...prevData.slice(index)];
      }
      return prevData;
    });
  }, [getNewItem]);

  const appendItem = useCallback(() => {
    setData(prevData => {
      const newItem = getNewItem(prevData);
      if (newItem) {
        return [...prevData, newItem];
      }
      return prevData;
    });
  }, [getNewItem]);

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
    setData(prevData =>
      [...prevData].sort(
        (a, b) => +a.value.split(' ')[1]! - +b.value.split(' ')[1]!
      )
    );
  }, []);

  const onRemoveItem = useCallback((item: string) => {
    setData(prevData => prevData.filter(i => i.value !== item));
  }, []);

  const renderItem = useCallback<SortableGridRenderItem<ItemType>>(
    ({ item }) => <GridItem item={item} onRemoveItem={onRemoveItem} />,
    [onRemoveItem]
  );

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
      // to ensure that it occupies the entire available space */}
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
              <Text style={styles.title}>Above SortableGrid</Text>
            </Group>

            <Sortable.Grid<ItemType>
              columnGap={spacing.sm}
              columns={COLUMNS}
              data={data}
              renderItem={renderItem}
              rowGap={spacing.xs}
              scrollableRef={scrollableRef}
              animateHeight
              hapticsEnabled
              onDragEnd={({ data: newData }) => setData(newData)}
            />

            <Group withMargin={false} bordered center>
              <Text style={styles.title}>Below SortableGrid</Text>
            </Group>
          </Animated.ScrollView>
        </Group>
      </Stagger>
    </Screen>
  );
}

type GridItemProps = {
  item: ItemType;
  onRemoveItem: (item: string) => void;
};

// It is recommended to use memo for items to prevent re-renders of the entire grid
// on item order changes (renderItem takes and index argument, thus it must be called
// after every order change)
const GridItem = memo(function GridItem({ item, onRemoveItem }: GridItemProps) {
  return (
    <Sortable.Pressable onPress={onRemoveItem.bind(null, item.value)}>
      <GridCard
        style={{ ...(!item.sortable ? { backgroundColor: '#c2c2c2' } : {}) }}>
        {item.value}
      </GridCard>
    </Sortable.Pressable>
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
    ...text.subHeading2,
    color: colors.foreground3
  }
});
