import { memo, type ReactNode, useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme';

import { CheckBox } from '../inputs';

type SwitchOption<V> = { label: string; value: V };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SwitchSettings<T = any> = [SwitchOption<T>, SwitchOption<T>];

type AnySettings = Record<string, SwitchSettings>;

type SelectedValues<O extends AnySettings> = {
  [K in keyof O]: O[K][0]['value'] | undefined;
};

export function useSettingsList<O extends AnySettings>(
  options: O
): {
  values: SelectedValues<O>;
  settingsComponent: ReactNode;
} {
  const entries = useMemo(() => Object.entries(options), [options]);
  const [values, setValues] = useState(
    () =>
      Object.fromEntries(
        entries.map(([key, [option]]) => [key, option.value])
      ) as SelectedValues<O>
  );

  const handleValueChange = useCallback(
    (key: keyof O, value: O[keyof O][0]['value']) => {
      setValues(prev => ({ ...prev, [key]: value }));
    },
    []
  );

  return {
    settingsComponent: (
      <View style={styles.container}>
        {entries.map(([key, settings]) => (
          <SettingsOption
            key={key}
            label={key}
            settings={settings}
            value={values[key]}
            onChange={handleValueChange}
          />
        ))}
      </View>
    ),
    values
  };
}

type SettingsOptionProps<K, V> = {
  label: K;
  settings: SwitchSettings<V>;
  value: V | undefined;
  onChange: (key: K, value: V | undefined) => void;
};

const SettingsOption = memo(function SettingsOption<K extends string, V>({
  label,
  onChange,
  settings,
  value
}: SettingsOptionProps<K, V>) {
  const [switchValue, setSwitchValue] = useState(() => settings[0].value);

  return (
    <View style={styles.option}>
      <CheckBox
        label={label}
        selected={!!value}
        onChange={selected =>
          onChange(label, selected ? switchValue : undefined)
        }
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: spacing.xxxs
  },
  option: {
    flexDirection: 'row'
  }
});
