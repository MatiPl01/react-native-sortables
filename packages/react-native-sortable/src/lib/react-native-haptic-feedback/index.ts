/**
 * Copied from library sources and adjusted to work with reanimated
 * and make it possible to use react-native-haptic-feedback as an
 * optional dependency
 */

/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { NativeModules, TurboModuleRegistry } from 'react-native';
// Types can be imported even if the module is not available
import type { HapticOptions } from 'react-native-haptic-feedback';
import { HapticFeedbackTypes } from 'react-native-haptic-feedback';

const loadNative = () => {
  const isTurboModuleEnabled = !!(global as any).__turboModuleProxy;
  const hapticFeedback = isTurboModuleEnabled
    ? TurboModuleRegistry.get('RNHapticFeedback')
    : NativeModules.RNHapticFeedback;
  return hapticFeedback?.trigger;
};

const load = () => {
  try {
    const nativeTrigger = loadNative();

    const defaultOptions = {
      enableVibrateFallback: false,
      ignoreAndroidSystemSettings: false
    };

    const createTriggerOptions = (options: HapticOptions) => {
      'worklet';
      // if options is a boolean we're using an api <=1.6 and we should pass use it to set the enableVibrateFallback option
      if (typeof options === 'boolean') {
        return {
          ...defaultOptions,
          enableVibrateFallback: options
        };
      }
      return { ...defaultOptions, ...options };
    };

    const trigger = (
      type:
        | HapticFeedbackTypes
        | keyof typeof HapticFeedbackTypes = HapticFeedbackTypes.selection,
      options: HapticOptions = {}
    ) => {
      'worklet';
      const triggerOptions = createTriggerOptions(options);

      try {
        nativeTrigger(type, triggerOptions);
      } catch (err) {
        console.warn('react-native-haptic-feedback is not available');
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
