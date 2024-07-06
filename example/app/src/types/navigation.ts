import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export enum ExamplesScreenRoute {
  AutoScrollExample = 'Auto Scroll Example',
  ExamplesList = 'Examples List',
  SortableFlexExamples = 'Sortable Flex Examples',
  SortableGridExamples = 'Sortable Grid Examples'
}

export type ExamplesStackParamList = {
  [ExamplesScreenRoute.ExamplesList]: undefined;
  [ExamplesScreenRoute.SortableFlexExamples]: undefined;
  [ExamplesScreenRoute.SortableGridExamples]: undefined;
  [ExamplesScreenRoute.AutoScrollExample]: undefined;
};

type CombinedNavigationProps = ExamplesStackParamList;

export type AppNavigation = NativeStackNavigationProp<CombinedNavigationProps>;

export const useAppNavigation = () => useNavigation<AppNavigation>();
