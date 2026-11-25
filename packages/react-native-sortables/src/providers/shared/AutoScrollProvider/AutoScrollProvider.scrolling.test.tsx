import { act, render } from '@testing-library/react-native';
import { type ComponentProps, useEffect } from 'react';
import type * as Reanimated from 'react-native-reanimated';
import { makeMutable } from 'react-native-reanimated';

import type { Vector } from '../../../types';
import { AutoScrollProvider, useAutoScrollContext } from './AutoScrollProvider';

const mockScrollOffset = makeMutable(0);
const mockCommonValues = {
  activeAnimationProgress: makeMutable(0),
  containerRef: { current: null },
  touchPosition: makeMutable<null | Vector>(null)
};

// A 600px tall scrollable at the top of the screen, filled by a 2000px tall
// sortable. Like a real one, it clamps the offset to its content (0-1400).
jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual<typeof Reanimated>(
    'react-native-reanimated'
  );
  return {
    ...actual,
    measure: (ref: unknown) => ({
      height: 600,
      pageY: ref === mockCommonValues.containerRef ? -mockScrollOffset.value : 0
    }),
    scrollTo: (_: unknown, __: number, y: number) => {
      mockScrollOffset.value = Math.min(Math.max(y, 0), 1400);
    },
    useScrollViewOffset: () => mockScrollOffset
  };
});

jest.mock('../CommonValuesProvider', () => ({
  useCommonValuesContext: () => mockCommonValues
}));

// The jest preset runs frames 1ms apart, use 60fps instead
global.requestAnimationFrame = callback => {
  setTimeout(() => callback(jest.now()), 16);
  return 0;
};

const props = {
  animateScrollTo: false,
  autoScrollActivationOffset: 75,
  autoScrollDirection: 'vertical',
  autoScrollEnabled: true,
  autoScrollExtrapolation: 'extend',
  autoScrollInterval: 0,
  autoScrollMaxOverscroll: 50,
  autoScrollMaxVelocity: 1000,
  scrollableRef: { current: null }
} as unknown as ComponentProps<typeof AutoScrollProvider>;

function Content() {
  const contentBounds = useAutoScrollContext()?.contentBounds;

  useEffect(() => {
    if (contentBounds) {
      contentBounds.value = [
        { x: 0, y: 0 },
        { x: 0, y: 2000 }
      ];
    }
  }, [contentBounds]);

  return null;
}

const advance = (ms: number) => act(() => jest.advanceTimersByTimeAsync(ms));

// The touch position is relative to the sortable
const dragTo = (y: number) => {
  mockCommonValues.touchPosition.value = { x: 0, y };
  return advance(32);
};

async function startDrag(scrollOffset: number) {
  mockScrollOffset.value = scrollOffset;
  mockCommonValues.activeAnimationProgress.value = 0;

  render(
    <AutoScrollProvider {...props}>
      <Content />
    </AutoScrollProvider>
  );

  await dragTo(scrollOffset + 300);
  mockCommonValues.activeAnimationProgress.value = 1;
  await advance(32);
}

describe('AutoScrollProvider', () => {
  it('scrolls when the speed is below one pixel per frame', async () => {
    await startDrag(0);

    // 5% into the end activation zone (525-600) is 50px/s
    await dragTo(528.75);
    await advance(1000);

    expect(mockScrollOffset.value).toBeCloseTo(50, -1);
  });
});
