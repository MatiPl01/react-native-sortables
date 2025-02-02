/**
 * Copied from library sources and adjusted to work with reanimated
 * and make it possible to use react-native-haptic-feedback as an
 * optional dependency
 */

/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable no-underscore-dangle */

import { NativeModules, TurboModuleRegistry } from 'react-native';
// Types can be imported even if the module is not available
import type { HapticOptions } from 'react-native-haptic-feedback';
import { runOnJS } from 'react-native-reanimated';

export const WARNINGS = {
  notAvailable: 'react-native-haptic-feedback is not available'
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
      return null;
    }
    // Lazy load the HapticFeedbackTypes
    // eslint-disable-next-line @typescript-eslint/no-var-requires
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
      } catch (err) {
        console.warn(`[react-native-sortables] ${WARNINGS.notAvailable}`);
      }
    };

    return trigger;
  } catch (err) {
    return null;
  }
};

const ReactNativeHapticFeedback = {
  load
};

export default ReactNativeHapticFeedback;
