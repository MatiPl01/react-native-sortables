import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export enum ExamplesScreenRoute {
  ExamplesList = 'Examples List',
  SortableFlexExamples = 'Sortable Flex Examples',
  SortableGridExamples = 'Sortable Grid Examples'
}

export type ExamplesStackParamList = {
  [ExamplesScreenRoute.ExamplesList]: undefined;
  [ExamplesScreenRoute.SortableFlexExamples]: undefined;
  [ExamplesScreenRoute.SortableGridExamples]: undefined;
};

type CombinedNavigationProps = ExamplesStackParamList;

export type AppNavigation = NativeStackNavigationProp<CombinedNavigationProps>;

export const useAppNavigation = () => useNavigation<AppNavigation>();
