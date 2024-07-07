import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';

import {
  AutoScrollFlatListExampleScreen,
  AutoScrollScrollViewExampleScreen,
  ExamplesListScreen,
  SortableFlexExamplesScreen,
  SortableGridExamplesScreen
} from '@/screens';
import { flex } from '@/theme';
import type { ExamplesStackParamList } from '@/types/navigation';
import { ExamplesScreenRoute } from '@/types/navigation';

const ExamplesStack = createNativeStackNavigator<ExamplesStackParamList>();

export default function ExamplesStackNavigator() {
  return (
    <View style={flex.fill}>
      <ExamplesStack.Navigator
        initialRouteName={ExamplesScreenRoute.ExamplesList}
        screenOptions={{
          headerBackTitleVisible: false
        }}>
        <ExamplesStack.Screen
          component={ExamplesListScreen}
          name={ExamplesScreenRoute.ExamplesList}
        />
        <ExamplesStack.Screen
          component={SortableGridExamplesScreen}
          name={ExamplesScreenRoute.SortableGridExamples}
        />
        <ExamplesStack.Screen
          component={SortableFlexExamplesScreen}
          name={ExamplesScreenRoute.SortableFlexExamples}
        />
        <ExamplesStack.Screen
          component={AutoScrollScrollViewExampleScreen}
          name={ExamplesScreenRoute.AutoScrollScrollViewExample}
        />
        <ExamplesStack.Screen
          component={AutoScrollFlatListExampleScreen}
          name={ExamplesScreenRoute.AutoScrollFlatListExample}
        />
      </ExamplesStack.Navigator>
    </View>
  );
}
