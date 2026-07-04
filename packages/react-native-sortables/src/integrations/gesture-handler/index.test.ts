import type * as Integration from './index';

// The adapters are replaced with sentinels so the test asserts *which* adapter
// the version detection wires up, without rendering any gesture hooks.
jest.mock('./adapters/v2', () => ({
  adapter: {
    useDragGesture: 'v2:useDragGesture',
    useEnabledGesture: 'v2:useEnabledGesture',
    useTouchableGesture: 'v2:useTouchableGesture'
  }
}));
jest.mock('./adapters/v3', () => ({
  adapter: {
    useDragGesture: 'v3:useDragGesture',
    useEnabledGesture: 'v3:useEnabledGesture',
    useTouchableGesture: 'v3:useTouchableGesture'
  }
}));

const loadWithGestureHandler = (mock: object): typeof Integration => {
  let integration!: typeof Integration;
  jest.doMock('react-native-gesture-handler', () => mock);
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    integration = require('./index') as typeof Integration;
  });
  return integration;
};

afterEach(() => {
  jest.resetModules();
  jest.dontMock('react-native-gesture-handler');
});

describe('gesture-handler adapter selection', () => {
  it('selects the v2 imperative adapter when the hook API is absent', () => {
    const integration = loadWithGestureHandler({
      Gesture: {},
      GestureDetector: () => null
    });

    expect(integration.useDragGesture).toBe('v2:useDragGesture');
    expect(integration.useEnabledGesture).toBe('v2:useEnabledGesture');
    expect(integration.useTouchableGesture).toBe('v2:useTouchableGesture');
  });

  it('selects the v3 hook adapter when useManualGesture is exported', () => {
    const integration = loadWithGestureHandler({
      GestureDetector: () => null,
      useManualGesture: () => ({})
    });

    expect(integration.useDragGesture).toBe('v3:useDragGesture');
    expect(integration.useEnabledGesture).toBe('v3:useEnabledGesture');
    expect(integration.useTouchableGesture).toBe('v3:useTouchableGesture');
  });
});
