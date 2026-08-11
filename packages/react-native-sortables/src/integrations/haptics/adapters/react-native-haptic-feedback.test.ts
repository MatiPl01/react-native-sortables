/* eslint-disable no-underscore-dangle -- __turboModuleProxy is a React Native global */

import { TurboModuleRegistry } from 'react-native';

import { logger } from '../../../utils';
import ReactNativeHapticFeedback from './react-native-haptic-feedback';

jest.mock('react-native-haptic-feedback', () => ({
  HapticFeedbackTypes: { selection: 'selection' }
}));

type TurboGlobal = { __turboModuleProxy?: unknown };
const turboGlobal = global as TurboGlobal;

describe('react-native-haptic-feedback adapter', () => {
  afterEach(() => {
    delete turboGlobal.__turboModuleProxy;
    jest.restoreAllMocks();
  });

  it('forwards the haptic type to the native trigger on the New Architecture', () => {
    turboGlobal.__turboModuleProxy = () => null;
    const nativeTrigger = jest.fn();
    jest
      .spyOn(TurboModuleRegistry, 'get')
      .mockReturnValue({ trigger: nativeTrigger } as never);

    const trigger = ReactNativeHapticFeedback.load();
    trigger?.('impactLight');

    expect(nativeTrigger).toHaveBeenCalledTimes(1);
    expect(nativeTrigger).toHaveBeenCalledWith(
      'impactLight',
      expect.any(Object)
    );
  });

  it('falls back to a warning no-op when the native module is unavailable', () => {
    turboGlobal.__turboModuleProxy = () => null;
    jest.spyOn(TurboModuleRegistry, 'get').mockReturnValue(null);
    const warn = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);

    const trigger = ReactNativeHapticFeedback.load();
    expect(typeof trigger).toBe('function');

    trigger?.();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('react-native-haptic-feedback')
    );
  });
});
