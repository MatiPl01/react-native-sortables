import { faHome } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SelectListDropdown } from '@/components';
import { colors, radius, sizes, spacing, text } from '@/theme';

import type { Routes } from './types';

type BottomNavBarProps = {
  homeRouteName: string;
  routes: Routes;
};

export default function BottomNavBar({
  homeRouteName,
  routes
}: BottomNavBarProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [routesGroup, setRoutesGroup] = useState<string | undefined>(() => {
    const state = navigation.getState();
    return state?.routes[1]?.name;
  });

  const options = useMemo(
    () =>
      Object.entries(routes).map(([route, { name }]) => ({
        label: name,
        value: `${homeRouteName}/${route}`
      })),
    [homeRouteName, routes]
  );

  useEffect(() => {
    return navigation.addListener('state', e => {
      setRoutesGroup(e.data.state.routes[1]?.name);
    });
  }, [navigation]);

  const handleSelect = useCallback(
    (value: string) => {
      if (value === routesGroup) {
        return;
      }

      navigation.reset({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
        routes: [{ name: homeRouteName }, { name: value }] as any
      });
    },
    [homeRouteName, navigation, routesGroup]
  );

  const handleHomePress = useCallback(() => {
    navigation.reset({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
      routes: [{ name: homeRouteName }] as any
    });
  }, [homeRouteName, navigation]);

  if (!routesGroup) {
    return null;
  }

  return (
    <View style={[styles.container, { bottom: insets.bottom }]}>
      <Animated.View
        entering={SlideInDown.delay(100)}
        exiting={SlideOutDown}
        style={styles.bar}>
        <TouchableOpacity style={styles.homeButton} onPress={handleHomePress}>
          <FontAwesomeIcon
            color={colors.primary}
            icon={faHome}
            size={sizes.xxs}
          />
        </TouchableOpacity>
        <Text style={text.label2}>Routes:</Text>
        <SelectListDropdown
          alignment='right'
          dropdownPosition='top'
          options={options}
          selected={routesGroup}
          styleOptions={{
            chevronColor: colors.white,
            dropdownStyle: styles.dropdown,
            inputStyle: styles.input,
            inputTextStyle: styles.inputText
          }}
          onSelect={handleSelect}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: 'center',
    backgroundColor: colors.background1,
    borderRadius: radius.lg,
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs
  },
  container: {
    alignItems: 'center',
    bottom: 0,
    elevation: spacing.xxs,
    left: 0,
    marginBottom: spacing.xs,
    pointerEvents: 'box-none',
    position: 'absolute',
    right: 0,
    shadowColor: colors.black,
    shadowOffset: { height: spacing.xxs, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: spacing.xs
  },
  dropdown: {
    backgroundColor: colors.background1,
    elevation: spacing.xxs,
    shadowOffset: { height: spacing.xxs, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: spacing.xs
  },
  homeButton: {
    backgroundColor: colors.background3,
    borderRadius: radius.md,
    padding: spacing.xs
  },
  input: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    borderWidth: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm
  },
  inputText: {
    ...text.label2,
    color: colors.white,
    fontWeight: 'bold'
  }
});
