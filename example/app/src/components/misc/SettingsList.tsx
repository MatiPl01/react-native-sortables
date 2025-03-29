import { memo, type ReactNode, useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';

import { spacing, text } from '@/theme';

import type { SwitchOptions } from '../inputs';
import { CheckBox, Switch } from '../inputs';

type AnySettings = Record<string, SwitchOptions>;

type SelectedValues<O extends AnySettings> = {
  [K in keyof O]: O[K][0]['value'] | undefined;
};

type DefaultSettings<O extends AnySettings> = {
  [K in keyof O]?: O[K][0]['value'] | undefined;
};

export function useSettingsList<O extends AnySettings>(
  options: O,
  defaultSettings?: DefaultSettings<O>
): {
  values: SelectedValues<O>;
  settingsComponent: ReactNode;
} {
  const entries = useMemo(() => Object.entries(options), [options]);
  const [values, setValues] = useState(
    () =>
      Object.fromEntries(
        entries.map(([key, [option]]) => [
          key,
          defaultSettings && key in defaultSettings
            ? defaultSettings[key]
            : option.value
        ])
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
      <Animated.View exiting={FadeOut} style={styles.container}>
        {entries.map(([key, settings]) => (
          <SettingsOption
            key={key}
            label={key}
            settings={settings}
            value={values[key]}
            onChange={handleValueChange}
          />
        ))}
      </Animated.View>
    ),
    values
  };
}

type SettingsOptionProps<K, V> = {
  label: K;
  settings: SwitchOptions<V>;
  value: V | undefined;
  onChange: (key: K, value: V | undefined) => void;
};

const SettingsOption = memo(function SettingsOption<K extends string, V>({
  label,
  onChange,
  settings,
  value
}: SettingsOptionProps<K, V>) {
  const [prevValue, setPrevValue] = useState<V | undefined>(
    () => settings[0].value
  );

  const handleChange = (newValue: V | undefined) => {
    setPrevValue(() => value);
    onChange(label, newValue);
  };

  return (
    <View style={styles.option}>
      <CheckBox
        label={label}
        labelStyle={text.label2}
        selected={!!value}
        onChange={selected => handleChange(selected ? prevValue : undefined)}
      />
      <Switch
        options={settings}
        value={value ?? prevValue}
        onChange={handleChange}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: spacing.xxxs
  },
  option: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  }
});
