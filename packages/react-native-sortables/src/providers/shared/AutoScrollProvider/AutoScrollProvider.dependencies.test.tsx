import { render } from '@testing-library/react-native';
import type { ComponentProps } from 'react';
import type * as Reanimated from 'react-native-reanimated';
import { useAnimatedReaction } from 'react-native-reanimated';

import { AutoScrollProvider } from './AutoScrollProvider';

let mockIsWeb = false;

jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual<typeof Reanimated>(
    'react-native-reanimated'
  );
  return {
    ...actual,
    useAnimatedReaction: jest.fn(actual.useAnimatedReaction),
    useScrollViewOffset: () => ({ value: 0 })
  };
});

jest.mock('../../../constants/platform', () => ({
  get IS_WEB() {
    return mockIsWeb;
  }
}));

jest.mock('../CommonValuesProvider', () => ({
  useCommonValuesContext: () => ({
    activeAnimationProgress: { value: 0 },
    containerRef: { current: null },
    touchPosition: { value: null }
  })
}));

const mockUseAnimatedReaction = jest.mocked(useAnimatedReaction);

const props = {
  autoScrollActivationOffset: 75,
  autoScrollDirection: 'vertical',
  autoScrollEnabled: true,
  autoScrollMaxOverscroll: 0,
  scrollableRef: { current: null }
} as unknown as ComponentProps<typeof AutoScrollProvider>;

const dependenciesOf = () =>
  mockUseAnimatedReaction.mock.calls.map(([, , dependencies]) => dependencies);

describe('AutoScrollProvider', () => {
  it('does not pass dependencies to useAnimatedReaction on native, where Reanimated warns about them', () => {
    mockIsWeb = false;

    render(<AutoScrollProvider {...props} />);

    expect(dependenciesOf().length).toBeGreaterThan(0);
    expect(dependenciesOf().every(deps => deps === undefined)).toBe(true);
  });

  it('passes dependencies to useAnimatedReaction on web, where Reanimated needs them', () => {
    mockIsWeb = true;

    render(<AutoScrollProvider {...props} />);

    expect(dependenciesOf().every(deps => Array.isArray(deps))).toBe(true);
  });
});
