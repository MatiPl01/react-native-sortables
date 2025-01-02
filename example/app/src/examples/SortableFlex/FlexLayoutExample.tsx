import { useState } from 'react';
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import type { SortableFlexStyle } from 'react-native-sortable';
import Sortable from 'react-native-sortable';

import {
  Button,
  FlexCell,
  Group,
  OptionGroup,
  SelectListDropdown
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
    justifyContent
  };

  return (
    <View style={styles.container}>
      <OptionGroup label='alignContent'>
        <Dropdown
          options={ALIGN_CONTENT_OPTIONS}
          selected={alignContent}
          onSelect={setAlignContent}
        />
      </OptionGroup>
      <OptionGroup label='justifyContent'>
        <Dropdown
          options={JUSTIFY_CONTENT_OPTIONS}
          selected={justifyContent}
          onSelect={setJustifyContent}
        />
      </OptionGroup>
      <OptionGroup label='alignItems'>
        <Dropdown
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

      <Group style={[flex.fill, styles.scrollViewGroup]}>
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
              <Sortable.Flex
                style={[
                  styles.sortableFlex,
                  flexStyle,
                  { flexDirection: direction }
                ]}>
                {DATA.map((item, index) => (
                  <FlexCell
                    height={34 + (index % 3) * 10}
                    key={item}
                    size='large'>
                    {item}
                  </FlexCell>
                ))}
              </Sortable.Flex>
            </Group>
          ))}
        </ScrollView>
      </Group>
    </View>
  );
}

type DropdownProps<T extends string> = {
  selected?: T;
  options: Array<T>;
  onSelect: (value: T) => void;
};

function Dropdown<T extends string>({
  onSelect,
  options,
  selected
}: DropdownProps<T>) {
  return (
    <SelectListDropdown
      alignment='right'
      selected={selected ?? options[0]!}
      styleOptions={{ dropdownStyle: styles.dropdown }}
      options={options.map(option => ({
        label: option,
        value: option
      }))}
      onSelect={onSelect}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    height:
      Dimensions.get('window').height -
      (Platform.OS === 'ios' ? sizes.xxl : sizes.lg)
  },
  dropdown: {
    minWidth: sizes.xxl
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
  },
  sortableFlex: {
    backgroundColor: colors.background3,
    borderRadius: radius.md,
    maxHeight: 300,
    minHeight: 225,
    overflow: 'hidden',
    padding: spacing.md
  }
});
