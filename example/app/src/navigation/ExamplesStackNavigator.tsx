import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  ExamplesListScreen,
  SortableFlexExamplesScreen,
  SortableGridExamplesScreen
} from '@/screens';
import {
  ExamplesScreenRoute,
  ExamplesStackParamList
} from '@/types/navigation';
import { View } from 'react-native';
import { flex } from '@/theme';

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
      </ExamplesStack.Navigator>
    </View>
  );
}
