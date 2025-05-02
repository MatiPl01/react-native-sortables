import { faCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text } from 'react-native';
import Sortable from 'react-native-sortables';

import { FlexCell, Screen, ScrollScreen } from '@/components';
import { colors, spacing, text } from '@/theme';
import { getCategories } from '@/utils';

const Tab = createBottomTabNavigator();

const DATA_LENGTH = 30;
const DATA = getCategories(DATA_LENGTH);

type FlexProps = {
  data: Array<string>;
};

function Flex({ data }: FlexProps) {
  return (
    <Sortable.Flex columnGap={spacing.sm} rowGap={spacing.xs}>
      {data.map(item => (
        <FlexCell key={item} size='large'>
          {item}
        </FlexCell>
      ))}
    </Sortable.Flex>
  );
}

function Screen1() {
  return (
    <ScrollScreen contentContainerStyle={styles.scrollContainer}>
      <Text style={styles.screenTitle}>Screen 1 flex:</Text>
      <Flex data={DATA.slice(0, DATA_LENGTH / 2)} />
    </ScrollScreen>
  );
}

function Screen2() {
  return (
    <ScrollScreen contentContainerStyle={styles.scrollContainer}>
      <Text style={styles.screenTitle}>Screen 2 flex:</Text>
      <Flex data={DATA.slice(DATA_LENGTH / 2)} />
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
  tabBarLabel: ({ focused }) => (
    <Text style={focused ? styles.focusedLabel : styles.label}>Screen 1</Text>
  )
};

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          shadowColor: 'transparent'
        }
      }}>
      <Tab.Screen component={Screen1} name='Screen1' options={tabBarOptions} />
      <Tab.Screen component={Screen2} name='Screen2' options={tabBarOptions} />
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
