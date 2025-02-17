import { useState } from 'react';
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import type { SortableFlexStyle } from 'react-native-sortables';
import Sortable from 'react-native-sortables';

import {
  Button,
  FlexCell,
  Group,
  OptionGroup,
  Screen,
  SimpleDropdown
} from '@/components';
import { colors, flex, radius, sizes, spacing, text } from '@/theme';
import { getCategories } from '@/utils';

const DATA = getCategories(9);

type FlexDirection = Required<SortableFlexStyle>['flexDirection'];
type AlignContent = Required<SortableFlexStyle>['alignContent'];
type JustifyContent = Required<SortableFlexStyle>['justifyContent'];
type AlignItems = Required<SortableFlexStyle>['alignItems'];
type FlexWrap = Required<SortableFlexStyle>['flexWrap'];

const FLEX_DIRECTIONS: Array<FlexDirection> = [
  'row',
  'column',
  'row-reverse',
  'column-reverse'
];

const ALIGN_CONTENT_OPTIONS: Array<AlignContent> = [
  'flex-start',
  'flex-end',
  'center',
  'space-between',
  'space-around',
  'space-evenly'
];

const JUSTIFY_CONTENT_OPTIONS: Array<JustifyContent> = [
  'flex-start',
  'flex-end',
  'center',
  'space-between',
  'space-around',
  'space-evenly'
];

const ALIGN_ITEMS_OPTIONS: Array<AlignItems> = [
  'flex-start',
  'flex-end',
  'center',
  'baseline'
];

const FLEX_WRAP_OPTIONS: Array<FlexWrap> = ['wrap', 'nowrap'];

export default function FlexLayoutExample() {
  const [alignContent, setAlignContent] = useState<AlignContent>();
  const [justifyContent, setJustifyContent] = useState<JustifyContent>();
  const [alignItems, setAlignItems] = useState<AlignItems>();
  const [flexWrapIndex, setFlexWrapIndex] = useState(0);

  const flexStyle = {
    alignContent,
    alignItems,
    flexWrap: FLEX_WRAP_OPTIONS[flexWrapIndex],
    gap: 10,
    justifyContent,
    maxHeight: 300,
    minHeight: 225,
    padding: spacing.md
  };

  return (
    <Screen style={styles.container}>
      <OptionGroup label='alignContent'>
        <SimpleDropdown
          options={ALIGN_CONTENT_OPTIONS}
          selected={alignContent}
          onSelect={setAlignContent}
        />
      </OptionGroup>
      <OptionGroup label='justifyContent'>
        <SimpleDropdown
          options={JUSTIFY_CONTENT_OPTIONS}
          selected={justifyContent}
          onSelect={setJustifyContent}
        />
      </OptionGroup>
      <OptionGroup label='alignItems'>
        <SimpleDropdown
          options={ALIGN_ITEMS_OPTIONS}
          selected={alignItems}
          onSelect={setAlignItems}
        />
      </OptionGroup>
      <OptionGroup label='flexWrap'>
        <Button
          title={FLEX_WRAP_OPTIONS[flexWrapIndex]!}
          onPress={() =>
            setFlexWrapIndex(prev => (prev + 1) % FLEX_WRAP_OPTIONS.length)
          }
        />
      </OptionGroup>

      <Group padding='none' style={[flex.fill, styles.scrollViewGroup]}>
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          style={flex.fill}>
          {FLEX_DIRECTIONS.map(direction => (
            <Group
              key={direction}
              style={styles.group}
              withMargin={false}
              bordered>
              <Text style={styles.groupTitle}>{direction}</Text>
              <View style={styles.flexWrapper}>
                <Sortable.Flex
                  flexDirection={direction}
                  width='fill'
                  {...flexStyle}>
                  {DATA.map((item, index) => (
                    <FlexCell
                      height={34 + (index % 3) * 10}
                      key={item}
                      size='large'>
                      {item}
                    </FlexCell>
                  ))}
                </Sortable.Flex>
              </View>
            </Group>
          ))}
        </ScrollView>
      </Group>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    height:
      Dimensions.get('window').height -
      (Platform.OS === 'ios' ? sizes.xxl : sizes.lg)
  },
  flexWrapper: {
    backgroundColor: colors.background3,
    borderRadius: radius.md,
    overflow: 'hidden'
  },
  group: {
    gap: spacing.xs,
    padding: spacing.none
  },
  groupTitle: {
    ...text.subHeading2,
    marginHorizontal: spacing.sm,
    marginTop: spacing.sm
  },
  scrollViewContent: {
    gap: spacing.sm,
    padding: spacing.sm
  },
  scrollViewGroup: {
    overflow: 'hidden',
    paddingHorizontal: spacing.none,
    paddingVertical: spacing.none
  }
});
