import type { HapticOptions } from 'react-native-haptic-feedback';

export const ReactNativeHapticFeedback = {
  load: () => (_type: string, _options?: HapticOptions) => {
    // noop
  }
};
