import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { memo, useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import { RouteCard, Stagger } from '@/components';
import { colors, flex, spacing } from '@/theme';

import exampleRoutes from './routes';
import type { Routes } from './types';
import { getScreenTitle, hasRoutes } from './utils';

const StackNavigator =
  createNativeStackNavigator<Record<string, React.ComponentType>>();

const BackButton = memo(function BackButton() {
  const navigation = useNavigation();
  const [prevRoute, setPrevRoute] = useState<string | undefined>(() => {
    const state = navigation.getState();
    return state?.routes[state.index - 1]?.key?.split('-')[0];
  });

  useFocusEffect(
    useCallback(() => {
      return navigation.addListener('state', e => {
        const { index, routes } = e.data.state;
        setPrevRoute(routes[index - 1]?.key?.split('-')[0]);
      });
    }, [navigation])
  );

  if (!prevRoute) {
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
  return function Navigator() {
    return (
      <View style={flex.fill}>
        <StackNavigator.Navigator
          screenOptions={{
            headerLeft: () => <BackButton />,
            headerShown: false,
            headerTitleAlign: 'center'
          }}>
          {createNavigationScreens(routes, 'Examples')}
        </StackNavigator.Navigator>
      </View>
    );
  };
}

function createRoutesScreen(routes: Routes, path: string): React.ComponentType {
  function RoutesScreen() {
    return (
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        style={styles.scrollView}>
        <Stagger>
          {Object.entries(routes).map(
            ([key, { CardComponent = RouteCard, name }]) => (
              <CardComponent key={key} route={`${path}/${key}`} title={name} />
            )
          )}
        </Stagger>
      </ScrollView>
    );
  }

  RoutesScreen.displayName = path + 'RoutesScreen';

  return RoutesScreen;
}

function createNavigationScreens(
  routes: Routes,
  path: string,
  parentName?: string
): Array<React.ReactNode> {
  return [
    // Create a screen for the navigation routes
    <StackNavigator.Screen
      component={createRoutesScreen(routes, path)}
      key={path}
      name={path}
      options={{
        contentStyle: styles.content,
        title: parentName ?? getScreenTitle(path)
      }}
    />,
    // Create screens for all nested routes or components
    ...Object.entries(routes).flatMap(([key, value]) => {
      const newPath = `${path}/${key}`;
      if (hasRoutes(value)) {
        return createNavigationScreens(value.routes, newPath, value.name);
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
    marginRight: spacing.xs,
    paddingTop: spacing.xxs
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16
  },
  content: {
    backgroundColor: colors.background3
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl
  },
  scrollViewContent: {
    gap: spacing.md
  }
});

export default createStackNavigator(exampleRoutes);
