import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, View } from 'react-native';

import { RouteCard } from '@/components';
import { colors, flex, spacing } from '@/theme';

import exampleRoutes from './routes';
import type { Routes } from './types';
import { getScreenTitle, hasRoutes } from './utils';

const StackNavigator =
  createNativeStackNavigator<Record<string, React.ComponentType<unknown>>>();

function createStackNavigator(routes: Routes): React.ComponentType {
  return function Navigator() {
    return (
      <View style={flex.fill}>
        <StackNavigator.Navigator>
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
        {Object.entries(routes).map(([key, { name }]) => (
          <RouteCard key={key} route={`${path}/${key}`} title={name} />
        ))}
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
      options={{ title: parentName ?? getScreenTitle(path) }}
    />,
    // Create screens for all nested routes or components
    ...Object.entries(routes).flatMap(([key, value]) => {
      const newPath = `${path}/${key}`;
      if (hasRoutes(value)) {
        return createNavigationScreens(value.routes, newPath, value.name);
      }
      return (
        <StackNavigator.Screen
          component={value.component}
          key={key}
          name={newPath}
          options={{ title: value.name }}
        />
      );
    })
  ];
}

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: colors.background3,
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl
  },
  scrollViewContent: {
    gap: spacing.md
  }
});

export default createStackNavigator(exampleRoutes);
