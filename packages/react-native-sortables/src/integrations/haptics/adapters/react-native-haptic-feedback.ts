/**
 * Copied from library sources and adjusted to work with reanimated
 * and make it possible to use react-native-haptic-feedback as an
 * optional dependency
 */

/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { NativeModules, TurboModuleRegistry } from 'react-native';
// Types can be imported even if the module is not available
import type { HapticOptions } from 'react-native-haptic-feedback';
import { runOnJS } from 'react-native-reanimated';

import { logger } from '../../../utils';

export const WARNINGS = {
  notAvailable: 'react-native-haptic-feedback is not available'
};

const notAvailableCallback = () => {
  'worklet';
  logger.warn(WARNINGS.notAvailable);
};

const loadNative = (isTurboModuleEnabled: boolean) => {
  const hapticFeedback = isTurboModuleEnabled
    ? TurboModuleRegistry.get('RNHapticFeedback')
    : NativeModules.RNHapticFeedback;
  return hapticFeedback?.trigger;
};

const load = () => {
  try {
    const isTurboModuleEnabled = !!(global as any).__turboModuleProxy;
    const nativeTrigger = loadNative(isTurboModuleEnabled);

    if (!nativeTrigger) {
      return notAvailableCallback;
    }
    // Lazy load the HapticFeedbackTypes
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { HapticFeedbackTypes } = require('react-native-haptic-feedback');

    const defaultOptions = {
      enableVibrateFallback: false,
      ignoreAndroidSystemSettings: true
    };

    const createTriggerOptions = (options: HapticOptions) => {
      'worklet';
      if (typeof options === 'boolean') {
        return {
          ...defaultOptions,
          enableVibrateFallback: options
        };
      }
      return { ...defaultOptions, ...options };
    };

    const trigger = (
      type: string = HapticFeedbackTypes.selection,
      options: HapticOptions = {}
    ) => {
      'worklet';
      const triggerOptions = createTriggerOptions(options);

      try {
        if (isTurboModuleEnabled) {
          nativeTrigger(type, triggerOptions);
        } else {
          // TODO - try to change this to run on UI if possible
          runOnJS(nativeTrigger)(type, triggerOptions);
        }
      } catch (_) {
        notAvailableCallback();
      }
    };

    return trigger;
  } catch (_) {
    return notAvailableCallback;
  }
};

const ReactNativeHapticFeedback = {
  load
};

export default ReactNativeHapticFeedback;
