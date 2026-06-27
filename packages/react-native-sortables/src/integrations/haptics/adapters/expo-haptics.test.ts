import ExpoHaptics from './expo-haptics';

type ExpoGlobal = {
  expo?: { modules?: { ExpoHaptics?: { impactAsync?: jest.Mock } } };
};

const expoGlobal = globalThis as ExpoGlobal;

describe('expo-haptics adapter', () => {
  beforeEach(() => {
    // expo-haptics is fired through runOnJS, which schedules a microtask; use
    // real timers so awaiting a microtask actually flushes it.
    jest.useRealTimers();
  });

  afterEach(() => {
    delete expoGlobal.expo;
  });

  it('bails when expo-haptics is not registered', () => {
    expect(ExpoHaptics.load()).toBeNull();
  });

  it('bails when the module does not expose impactAsync', () => {
    expoGlobal.expo = { modules: { ExpoHaptics: {} } };

    expect(ExpoHaptics.load()).toBeNull();
  });

  it('maps impact types to expo-haptics impact styles', async () => {
    const impactAsync = jest.fn(() => Promise.resolve());
    expoGlobal.expo = { modules: { ExpoHaptics: { impactAsync } } };

    const trigger = ExpoHaptics.load();
    expect(trigger).not.toBeNull();

    trigger?.('impactMedium');
    trigger?.('impactLight');
    trigger?.();
    // expo-haptics is fired on the JS thread via runOnJS (queued as a microtask)
    await Promise.resolve();

    expect(impactAsync.mock.calls).toEqual([['medium'], ['light'], ['light']]);
  });

  it('swallows rejections from impactAsync', async () => {
    const impactAsync = jest.fn(() => Promise.reject(new Error('unsupported')));
    expoGlobal.expo = { modules: { ExpoHaptics: { impactAsync } } };

    const trigger = ExpoHaptics.load();
    expect(() => trigger?.('impactLight')).not.toThrow();
    await Promise.resolve();

    expect(impactAsync).toHaveBeenCalledWith('light');
  });
});
