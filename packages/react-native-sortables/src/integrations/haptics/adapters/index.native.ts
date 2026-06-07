import ExpoHaptics from './expo-haptics';
import ReactNativeHapticFeedback from './react-native-haptic-feedback';

export const Haptics = {
  // Prefer expo-haptics (available in any Expo app, including Expo Go) and
  // fall back to react-native-haptic-feedback for bare React Native apps.
  load: () => ExpoHaptics.load() ?? ReactNativeHapticFeedback.load()
};
