import { render } from '@testing-library/react-native';
import type { ComponentProps } from 'react';
import type * as Reanimated from 'react-native-reanimated';
import { Extrapolation, useAnimatedReaction } from 'react-native-reanimated';

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

const globals = globalThis as { __DEV__?: boolean };

afterEach(() => {
  jest.restoreAllMocks();
});

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

  it.each<Partial<typeof props>>([
    { autoScrollActivationOffset: 200 },
    { autoScrollDirection: 'horizontal' },
    { autoScrollExtrapolation: Extrapolation.CLAMP },
    { autoScrollMaxOverscroll: 100 }
  ])(
    'changes the progress reaction dependencies on web when %p changes',
    changedProps => {
      mockIsWeb = true;
      // The debug helpers change on every render in dev, so the dependencies
      // can stay the same only in production
      jest.replaceProperty(globals, '__DEV__', false);

      const { rerender } = render(<AutoScrollProvider {...props} />);
      rerender(<AutoScrollProvider {...props} {...changedProps} />);

      // Every render registers the activation and the progress reaction
      const [, initial, , updated] = dependenciesOf();
      expect(updated).not.toEqual(initial);
    }
  );
});
