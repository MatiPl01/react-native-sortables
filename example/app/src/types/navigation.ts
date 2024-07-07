import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export enum ExamplesScreenRoute {
  AutoScrollFlatListExample = 'AutoScrollFlatListExample',
  AutoScrollScrollViewExample = 'AutoScrollScrollViewExample',
  DropIndicatorExamples = 'DropIndicatorExamples',
  ExamplesList = 'ExamplesList',
  SortableFlexExamples = 'SortableFlexExamples',
  SortableGridExamples = 'SortableGridExamples'
}

export type ExamplesStackParamList = {
  [ExamplesScreenRoute.ExamplesList]: undefined;
  [ExamplesScreenRoute.SortableFlexExamples]: undefined;
  [ExamplesScreenRoute.SortableGridExamples]: undefined;
  [ExamplesScreenRoute.AutoScrollScrollViewExample]: undefined;
  [ExamplesScreenRoute.AutoScrollFlatListExample]: undefined;
  [ExamplesScreenRoute.DropIndicatorExamples]: undefined;
};

type CombinedNavigationProps = ExamplesStackParamList;

export type AppNavigation = NativeStackNavigationProp<CombinedNavigationProps>;

export const useAppNavigation = () => useNavigation<AppNavigation>();
