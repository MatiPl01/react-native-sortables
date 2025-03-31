import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { memo, useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import Sortable from 'react-native-sortables';

import { RouteCard, ScrollScreen, Stagger } from '@/components';
import { IS_WEB } from '@/constants';
import {
  BottomNavBarHeightProvider,
  BottomNavBarSettingsProvider,
  useBottomNavBarSettings
} from '@/providers';
import { colors, iconSizes, radius, spacing, text } from '@/theme';

import BottomNavBar from './BottomNavBar';
import exampleRoutes from './routes';
import type { Routes } from './types';
import { getScreenTitle, isRouteWithRoutes } from './utils';

const StackNavigator =
  createNativeStackNavigator<Record<string, React.ComponentType>>();

const BackButton = memo(function BackButton() {
  const navigation = useNavigation();
  const [prevRoute, setPrevRoute] = useState<string | undefined>(() => {
    const state = navigation.getState();
    return state?.routes[state.index - 1]?.name;
  });

  useFocusEffect(
    useCallback(() => {
      return navigation.addListener('state', e => {
        const { index, routes } = e.data.state;
        setPrevRoute(routes[index - 1]?.name);
      });
    }, [navigation])
  );

  if (!prevRoute || !navigation.canGoBack()) {
    return null;
  }

  return (
    <Pressable
      hitSlop={spacing.md}
      style={styles.backButton}
      onPress={() => {
        navigation.goBack();
      }}>
      <FontAwesomeIcon color={colors.primary} icon={faChevronLeft} />
      <Text style={styles.backButtonText}>{getScreenTitle(prevRoute)}</Text>
    </Pressable>
  );
});

function createStackNavigator(routes: Routes): React.ComponentType {
  function Navigator() {
    const { settings } = useBottomNavBarSettings();

    const navigatorComponent = useMemo(
      () => (
        <StackNavigator.Navigator
          screenOptions={{
            headerLeft: () => <BackButton />,
            headerTitleAlign: 'center'
          }}>
          {createNavigationScreens(routes, 'Examples', ['Examples'])}
        </StackNavigator.Navigator>
      ),
      []
    );

    return (
      <Sortable.PortalProvider enabled={settings.activeItemPortalEnabled}>
        <BottomNavBarHeightProvider>
          <View style={styles.container}>
            {navigatorComponent}
            <BottomNavBar homeRouteName='Examples' routes={routes} />
          </View>
        </BottomNavBarHeightProvider>
      </Sortable.PortalProvider>
    );
  }

  return function WrappedNavigator() {
    return (
      <BottomNavBarSettingsProvider>
        <Navigator />
      </BottomNavBarSettingsProvider>
    );
  };
}

function createRouteCards(
  routes: Routes,
  path: string,
  parentFlatten = false,
  nestingDepth = 0
): React.ReactNode {
  return Object.entries(routes).flatMap(([key, value]) => {
    if (parentFlatten && isRouteWithRoutes(value)) {
      return [
        <View
          key={key}
          style={[
            styles.listTitleWrapper,
            { paddingLeft: nestingDepth * spacing.md }
          ]}>
          {nestingDepth > 0 && <View style={styles.listBullet} />}
          <Text
            style={
              text[
                `heading${Math.min(nestingDepth + 3, 4)}` as keyof typeof text
              ]
            }>
            {value.name}
          </Text>
        </View>,
        createRouteCards(
          value.routes,
          `${path}/${key}`,
          value.flatten,
          nestingDepth + 1
        )
      ];
    }

    const { CardComponent = RouteCard, name, ...rest } = value;

    return (
      <View key={key} style={{ paddingLeft: (nestingDepth - 1) * spacing.md }}>
        <CardComponent {...rest} route={`${path}/${key}`} title={name} />
      </View>
    );
  });
}

function createRoutesScreen(
  routes: Routes,
  path: string,
  flatten: boolean,
  staggerDelay = 0
): React.ComponentType {
  function RoutesScreen() {
    return (
      <ScrollScreen
        contentContainerStyle={styles.scrollViewContent}
        includeNavBarHeight>
        <Stagger delay={staggerDelay} interval={50}>
          {createRouteCards(routes, path, flatten)}
        </Stagger>
      </ScrollScreen>
    );
  }

  RoutesScreen.displayName = path + 'RoutesScreen';

  return RoutesScreen;
}

type StackScreensOptions = {
  flatten: boolean;
  depth: number;
  parentOptions?: StackScreensOptions;
};

function createNavigationScreens(
  routes: Routes,
  name: string,
  pathChunks: Array<string>,
  options?: StackScreensOptions
): Array<React.ReactNode> {
  const { depth = 0, flatten = false } = options ?? {};

  const path = pathChunks.join('/');

  return [
    // Create a screen for the navigation routes
    !options?.parentOptions?.flatten && (
      <StackNavigator.Screen
        key={path}
        name={path}
        component={createRoutesScreen(
          routes,
          path,
          flatten,
          depth === 1 ? 150 : 0
        )}
        options={{
          animation: depth > 1 ? 'slide_from_right' : 'fade',
          contentStyle: styles.content,
          title: name
        }}
      />
    ),
    // Create screens for all nested routes or components
    ...Object.entries(routes).flatMap(([key, value]) => {
      const newPath = `${path}/${key}`;
      if (isRouteWithRoutes(value)) {
        return createNavigationScreens(
          value.routes,
          value.name,
          [...pathChunks, key],
          {
            depth: depth + 1,
            flatten: !!value.flatten,
            parentOptions: options
          }
        );
      }
      return (
        <StackNavigator.Screen
          component={value.Component}
          key={key}
          name={newPath}
          options={{ contentStyle: styles.content, title: value.name }}
        />
      );
    })
  ];
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xxs,
    marginLeft: IS_WEB ? spacing.md : 0,
    marginRight: spacing.xs,
    paddingTop: spacing.xxs
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16
  },
  container: {
    backgroundColor: colors.background3,
    flex: 1
  },
  content: {
    backgroundColor: colors.background3
  },
  listBullet: {
    backgroundColor: colors.foreground1,
    borderRadius: radius.full,
    height: iconSizes.xs,
    marginRight: spacing.sm,
    width: iconSizes.xs
  },
  listTitleWrapper: {
    alignItems: 'center',
    flexDirection: 'row'
  },
  scrollViewContent: {
    gap: spacing.md,
    padding: spacing.md,
    paddingBottom: 0
  }
});

export default createStackNavigator(exampleRoutes);
