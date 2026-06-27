import ExpoHaptics from './expo-haptics';
import Pulsar from './pulsar';
import ReactNativeHapticFeedback from './react-native-haptic-feedback';
import type { HapticsAdapter } from './types';

// Tried in priority order; the first available backend provides the trigger.
const ADAPTERS: Array<HapticsAdapter> = [
  Pulsar,
  ExpoHaptics,
  ReactNativeHapticFeedback
];

export const Haptics = {
  load: () => {
    for (const adapter of ADAPTERS) {
      const trigger = adapter.load();
      if (trigger) {
        return trigger;
      }
    }
    return null;
  }
};
