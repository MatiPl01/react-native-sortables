import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import { ActionSheetDropdown, RotatableChevron } from '@/components/misc';
import { colors, radius, spacing, text } from '@/theme';

export type SelectListOption<T> = {
  label: string;
  value: T;
};

type SelectListsDropdownProps<T> = {
  options: Array<SelectListOption<T>>;
  selected: T;
  alignment?: 'left' | 'right';
  styleOptions?: {
    dropdownStyle?: StyleProp<ViewStyle>;
    inputStyle?: StyleProp<ViewStyle>;
    optionTextStyle?: StyleProp<TextStyle>;
  };
  onSelect: (value: T) => void;
};

export default function SelectListDropdown<T>({
  alignment,
  onSelect,
  options,
  selected,
  styleOptions
}: SelectListsDropdownProps<T>) {
  const isExpanded = useSharedValue(false);

  const selectedLabel =
    options.find(option => option.value === selected)?.label ?? '-';

  const dropdownOptions = options.map(option => ({
    key: option.label,
    onPress: () => onSelect(option.value),
    render: () => (
      <DropdownOption
        label={option.label}
        optionTextStyle={styleOptions?.optionTextStyle}
        selected={option.value === selected}
      />
    )
  }));

  return (
    <ActionSheetDropdown
      options={dropdownOptions}
      styleOptions={{
        alignment,
        dropdownStyle: [styles.dropdown, styleOptions?.dropdownStyle]
      }}
      onClose={() => (isExpanded.value = false)}
      onOpen={() => (isExpanded.value = true)}>
      <View style={[styles.input, styleOptions?.inputStyle]}>
        <Text
          numberOfLines={1}
          style={[styles.optionText, styleOptions?.optionTextStyle]}>
          {selectedLabel}
        </Text>
        <RotatableChevron color={colors.foreground2} open={isExpanded} />
      </View>
    </ActionSheetDropdown>
  );
}

type DropdownOptionProps = {
  label: string;
  selected: boolean;
  style?: StyleProp<ViewStyle>;
  optionTextStyle?: StyleProp<TextStyle>;
};

function DropdownOption({
  label,
  optionTextStyle,
  selected,
  style
}: DropdownOptionProps) {
  return (
    <View style={[styles.option, style]}>
      <Text
        style={[
          styles.optionText,
          optionTextStyle,
          selected && styles.selectedOptionText
        ]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  dropdown: {
    backgroundColor: colors.background2,
    borderRadius: radius.sm,
    minHeight: 32
  },
  input: {
    alignItems: 'center',
    backgroundColor: colors.background2,
    borderColor: colors.background3,
    borderRadius: radius.xs,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs
  },
  option: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  optionText: {
    ...text.label2,
    color: colors.foreground2
  },
  selectedOptionText: {
    color: colors.primary
  }
});
