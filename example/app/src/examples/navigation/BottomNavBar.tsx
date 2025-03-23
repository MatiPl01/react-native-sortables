import { faCog, faHome } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  LinearTransition,
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
  useDerivedValue,
  withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SelectListDropdown } from '@/components';
import { IS_WEB } from '@/constants';
import { useBottomNavBarHeight } from '@/providers';
import { colors, radius, sizes, spacing, text } from '@/theme';

import BottomNavBarSettings from './BottomNavBarSettings';
import type { Routes } from './types';

const bezierEasing = Easing.bezier(0.34, 1.56, 0.64, 1).factory();

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
  const [settingsShown, setSettingsShown] = useState(false);
  const settingsAnimationProgress = useDerivedValue(() =>
    withTiming(+settingsShown, { duration: 500, easing: bezierEasing })
  );

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
      setSettingsShown(false);
      setRoutesGroup(e?.data?.state?.routes[1]?.name);
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

  const handleHomePress = () => {
    navigation.reset({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
      routes: [{ name: homeRouteName }] as any
    });
  };

  const handleSettingsPress = () => {
    setSettingsShown(shown => !shown);
  };

  const handleSettingsClose = () => {
    setSettingsShown(false);
  };

  const animatedSettingsStyle = useAnimatedStyle(() => {
    const progress = settingsAnimationProgress.value;

    return {
      opacity: interpolate(progress, [0, 1], [1, 0.5]),
      transform: [{ rotate: `${progress * 180}deg` }]
    };
  });

  if (!routesGroup) {
    return null;
  }

  const layout = IS_WEB
    ? undefined
    : LinearTransition.duration(200).easing(bezierEasing);

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
        layout={layout}
        style={styles.bar}
        entering={SlideInDown.delay(100)
          .duration(500)
          .easing(IS_WEB ? Easing.bounce : Easing.out(Easing.quad))}>
        {settingsShown && (
          <BottomNavBarSettings onClose={handleSettingsClose} />
        )}
        <Animated.View layout={layout} style={styles.barOptions}>
          <TouchableOpacity style={styles.button} onPress={handleHomePress}>
            <FontAwesomeIcon
              color={colors.primary}
              icon={faHome}
              size={sizes.xxs}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleSettingsPress}>
            <Animated.View style={animatedSettingsStyle}>
              <FontAwesomeIcon
                color={colors.primary}
                icon={faCog}
                size={sizes.xxs}
              />
            </Animated.View>
          </TouchableOpacity>
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
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.background1,
    borderRadius: radius.lg,
    boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden'
  },
  barOptions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs
  },
  button: {
    backgroundColor: colors.background3,
    borderRadius: radius.md,
    padding: spacing.xs
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
