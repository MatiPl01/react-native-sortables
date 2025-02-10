import { StyleSheet } from 'react-native';

import { sizes } from '@/theme';

import SelectListDropdown from './SelectListDropdown';

type SimpleDropdownProps<T> = {
  selected?: T;
  options: Array<T>;
  onSelect: (value: T) => void;
};

export default function SimpleDropdown<T extends number | string>({
  onSelect,
  options,
  selected
}: SimpleDropdownProps<T>) {
  return (
    <SelectListDropdown
      alignment='right'
      selected={selected ?? options[0]!}
      styleOptions={{ dropdownStyle: styles.dropdown }}
      options={options.map(option => ({
        label: option.toString(),
        value: option
      }))}
      onSelect={onSelect}
    />
  );
}

const styles = StyleSheet.create({
  dropdown: {
    minWidth: sizes.xxl
  }
});
