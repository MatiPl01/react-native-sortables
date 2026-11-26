import { act, render } from '@testing-library/react-native';
import { type ComponentProps, useEffect } from 'react';
import type * as Reanimated from 'react-native-reanimated';
import { makeMutable } from 'react-native-reanimated';

import { AutoScrollProvider, useAutoScrollContext } from './AutoScrollProvider';

const mockSetActive = jest.fn();
const mockFrame = jest.fn();
const mockActiveAnimationProgress = makeMutable(0);
const mockTouchPosition = makeMutable({ x: 0, y: 250 });

jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual<typeof Reanimated>(
    'react-native-reanimated'
  );
  return {
    ...actual,
    measure: () => ({ height: 500, pageX: 0, pageY: 0, width: 300 }),
    // Registers the real frame callback to count the frames it runs
    useFrameCallback: (
      callback: (info: Reanimated.FrameInfo) => void,
      autostart?: boolean
    ) => ({
      ...actual.useFrameCallback(info => {
        mockFrame();
        callback(info);
      }, autostart),
      setActive: mockSetActive
    }),
    useScrollViewOffset: () => ({ value: 0 })
  };
});

jest.mock('../CommonValuesProvider', () => ({
  useCommonValuesContext: () => ({
    activeAnimationProgress: mockActiveAnimationProgress,
    containerRef: { current: null },
    touchPosition: mockTouchPosition
  })
}));

function ContentBounds() {
  const contentBounds = useAutoScrollContext()?.contentBounds;

  useEffect(() => {
    if (contentBounds) {
      contentBounds.value = [
        { x: 0, y: 0 },
        { x: 300, y: 1000 }
      ];
    }
  }, [contentBounds]);

  return null;
}

const Provider = ({ enabled }: { enabled: boolean }) => (
  <AutoScrollProvider
    {...({
      autoScrollActivationOffset: 75,
      autoScrollDirection: 'vertical',
      autoScrollEnabled: enabled,
      autoScrollMaxOverscroll: 0,
      scrollableRef: { current: null }
    } as unknown as ComponentProps<typeof AutoScrollProvider>)}>
    <ContentBounds />
  </AutoScrollProvider>
);

const flush = () =>
  act(() => {
    jest.runOnlyPendingTimers();
  });

describe('AutoScrollProvider', () => {
  it('does not run the frame callback before an item is activated', async () => {
    render(<Provider enabled />);
    await act(() => jest.advanceTimersByTimeAsync(500));

    expect(mockFrame).not.toHaveBeenCalled();
  });

  it('starts the frame callback again when auto scroll is re-enabled during a drag', () => {
    const { rerender } = render(<Provider enabled />);
    flush();
    act(() => {
      mockActiveAnimationProgress.value = 1;
    });
    flush();
    expect(mockSetActive).toHaveBeenLastCalledWith(true);

    rerender(<Provider enabled={false} />);
    mockSetActive.mockClear();
    rerender(<Provider enabled />);
    flush();

    expect(mockSetActive).toHaveBeenLastCalledWith(true);
  });
});
