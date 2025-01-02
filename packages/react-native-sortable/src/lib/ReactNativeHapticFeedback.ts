/**
 * Copied from library sources and adjusted to work with reanimated
 * worklet runtime and make it possible to use react-native-haptic-feedback
 * as an optional dependency
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
import { HapticFeedbackTypes } from 'react-native-haptic-feedback';
import { runOnJS } from 'react-native-reanimated';

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

    const defaultOptions = {
      enableVibrateFallback: false,
      ignoreAndroidSystemSettings: true
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
        if (isTurboModuleEnabled) {
          nativeTrigger(type, triggerOptions);
        } else {
          // I couldn't get it working right without calling runOnJS on the old
          // architecture (paper) so I decided to use it here
          runOnJS(nativeTrigger)(type, triggerOptions);
        }
      } catch (err) {
        console.warn('react-native-haptic-feedback is not available');
      }
    };

    return { trigger };
  } catch (err) {
    return null;
  }
};

const ReactNativeHapticFeedback = {
  load
};

export default ReactNativeHapticFeedback;
