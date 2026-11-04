import { render } from '@testing-library/react-native';
import type * as Reanimated from 'react-native-reanimated';
import { makeMutable, useAnimatedStyle } from 'react-native-reanimated';

import type { DebugLineProps, DebugRectProps } from '../../types/debug';
import DebugLine from './DebugLine';
import DebugRect from './DebugRect';

let mockIsWeb = false;

jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual<typeof Reanimated>(
    'react-native-reanimated'
  );
  return {
    ...actual,
    __esModule: true,
    default: actual.default,
    useAnimatedStyle: jest.fn(actual.useAnimatedStyle)
  };
});

jest.mock('../../constants/platform', () => ({
  get IS_WEB() {
    return mockIsWeb;
  }
}));

const mockUseAnimatedStyle = jest.mocked(useAnimatedStyle);

const dependenciesOf = () =>
  mockUseAnimatedStyle.mock.calls.map(([, dependencies]) => dependencies);

describe.each([
  [
    'DebugLine',
    () => (
      <DebugLine
        props={makeMutable<DebugLineProps>({ type: 'vertical', x: 0 })}
      />
    )
  ],
  [
    'DebugRect',
    () => (
      <DebugRect
        props={makeMutable<DebugRectProps>({ height: 1, width: 1, x: 0, y: 0 })}
      />
    )
  ]
])('%s', (_, renderComponent) => {
  it('does not pass dependencies to useAnimatedStyle on native, where Reanimated warns about them', () => {
    mockIsWeb = false;

    render(renderComponent());

    expect(dependenciesOf().every(deps => deps === undefined)).toBe(true);
  });

  it('passes dependencies to useAnimatedStyle on web, where Reanimated needs them', () => {
    mockIsWeb = true;

    render(renderComponent());

    expect(dependenciesOf().some(deps => Array.isArray(deps))).toBe(true);
  });
});
