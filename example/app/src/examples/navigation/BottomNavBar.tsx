import { faHome } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  Easing,
  LinearTransition,
  SlideInDown,
  SlideOutDown
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SelectListDropdown } from '@/components';
import { useBottomNavBarHeight } from '@/contexts';
import { colors, radius, sizes, spacing, text } from '@/theme';
import { IS_WEB } from '@/utils';

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
  const height = useBottomNavBarHeight();

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
    <View
      style={[
        styles.container,
        { paddingBottom: insets.bottom + (IS_WEB ? spacing.md : spacing.xs) }
      ]}
      onLayout={e => {
        height.value = e.nativeEvent.layout.height;
      }}>
      <Animated.View
        exiting={SlideOutDown}
        layout={IS_WEB ? undefined : LinearTransition}
        style={styles.bar}
        entering={SlideInDown.delay(100)
          .duration(500)
          .easing(Easing.out(Easing.quad))}>
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
    padding: spacing.xs,
    shadowColor: colors.black,
    ...Platform.select({
      android: {
        elevation: spacing.xxs
      },
      default: {
        shadowOffset: { height: spacing.xxs, width: 0 },
        shadowOpacity: 0.1,
        shadowRadius: spacing.xs
      },
      web: {
        boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.1)'
      }
    })
  },
  container: {
    alignItems: 'center',
    bottom: 0,
    elevation: spacing.xxs,
    left: 0,
    pointerEvents: 'box-none',
    position: 'absolute',
    right: 0
  },
  dropdown: {
    backgroundColor: colors.background1
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
