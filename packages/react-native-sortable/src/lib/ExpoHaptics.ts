/**
 * Copied from library sources and adjusted to work with reanimated
 * worklet runtime and make it possible to use expo-haptics as an
 * optional dependency
 */

/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable no-underscore-dangle */

import { requireOptionalNativeModule } from 'expo';
import { ImpactFeedbackStyle } from 'expo-haptics';

const loadNative = () => {
  const expoHaptics = requireOptionalNativeModule('ExpoHaptics');
  return expoHaptics?.impactAsync;
};

const load = () => {
  try {
    const impactAsync = loadNative();

    const trigger = (style: ImpactFeedbackStyle) => {
      'worklet';
      impactAsync(style);
    };

    return { ImpactFeedbackStyle, trigger };
  } catch (error) {
    return null;
  }
};

const ExpoHaptics = {
  load
};

export default ExpoHaptics;
