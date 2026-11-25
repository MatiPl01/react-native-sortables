import { version as reactVersion } from 'react';
import { Platform } from 'react-native';

export const IS_WEB = Platform.OS === 'web';
export const IS_ANDROID = Platform.OS === 'android';

export const IS_REACT_19 = reactVersion.startsWith('19.');

// Reanimated no longer sets its `_IS_FABRIC` global (since worklets 0.9), so
// the global installed by the React Native renderer is checked instead
export function isFabric() {
  return !!(globalThis as { nativeFabricUIManager?: unknown })
    .nativeFabricUIManager;
}

export function isPaper() {
  return !IS_WEB && !isFabric();
}
