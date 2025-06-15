import 'react-native-gesture-handler/jestSetup';

// Adds missing mock in RN 0.80.0
// https://github.com/facebook/react-native/issues/51993#issuecomment-2970614900
jest.mock('react-native/Libraries/Components/RefreshControl/RefreshControl', () => ({
  __esModule: true,
  default: require('./__mocks__/RefreshControlMock'),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
