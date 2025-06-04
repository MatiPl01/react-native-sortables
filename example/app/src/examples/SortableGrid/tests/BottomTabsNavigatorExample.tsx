import { faCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useCallback } from 'react';
import { StyleSheet, Text } from 'react-native';
import type { SortableGridRenderItem } from 'react-native-sortables';
import Sortable from 'react-native-sortables';

import { GridCard, Screen, ScrollScreen } from '@/components';
import { colors, spacing, text } from '@/theme';

const Tab = createBottomTabNavigator();

const DATA_LENGTH = 36;
const DATA = Array.from(
  { length: DATA_LENGTH },
  (_, index) => `Item ${index + 1}`
);

type GridProps = {
  data: Array<string>;
};

function Grid({ data }: GridProps) {
  const renderItem = useCallback<SortableGridRenderItem<string>>(
    ({ item }) => <GridCard>{item}</GridCard>,
    []
  );

  return (
    <Sortable.Grid
      columnGap={10}
      columns={3}
      data={data}
      dragActivationDelay={0}
      renderItem={renderItem}
      rowGap={10}
    />
  );
}

function Screen1() {
  return (
    <ScrollScreen contentContainerStyle={styles.scrollContainer}>
      <Text style={styles.screenTitle}>Screen 1 grid:</Text>
      <Grid data={DATA.slice(0, DATA_LENGTH / 2)} />
    </ScrollScreen>
  );
}

function Screen2() {
  return (
    <ScrollScreen contentContainerStyle={styles.scrollContainer}>
      <Text style={styles.screenTitle}>Screen 2 grid:</Text>
      <Grid data={DATA.slice(DATA_LENGTH / 2)} />
    </ScrollScreen>
  );
}

function Screen3() {
  return (
    <ScrollScreen contentContainerStyle={styles.scrollContainer}>
      <Text style={styles.screenTitle}>Screen without sortable grid</Text>
    </ScrollScreen>
  );
}

const tabBarOptions: BottomTabNavigationOptions = {
  tabBarIcon: ({ focused }) => (
    <FontAwesomeIcon
      color={focused ? colors.primary : colors.foreground3}
      icon={faCircle}
    />
  ),
  tabBarLabel: ({ children, focused }) => (
    <Text style={focused ? styles.focusedLabel : styles.label}>{children}</Text>
  )
};

function Tabs() {
  return (
    <Tab.Navigator
      // This option breaks sortable state when navigating between screens
      // https://github.com/MatiPl01/react-native-sortables/issues/308
      detachInactiveScreens={false}
      screenOptions={{
        tabBarStyle: {
          shadowColor: 'transparent'
        }
      }}>
      <Tab.Screen
        component={Screen1}
        name='Sortable 1'
        options={tabBarOptions}
      />
      <Tab.Screen
        component={Screen2}
        name='Sortable 2'
        options={tabBarOptions}
      />
      <Tab.Screen
        component={Screen3}
        name='No sortable'
        options={tabBarOptions}
      />
    </Tab.Navigator>
  );
}

export default function BottomTabsNavigatorExample() {
  return (
    <Screen style={styles.container} includeNavBarHeight>
      <Tabs />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white
  },
  focusedLabel: {
    ...text.label3,
    color: colors.primary
  },
  label: {
    ...text.label3,
    color: colors.foreground3,
    fontWeight: 'normal'
  },
  screenTitle: {
    ...text.label1,
    color: colors.foreground1,
    marginBottom: spacing.md
  },
  scrollContainer: {
    padding: spacing.md
  }
});
