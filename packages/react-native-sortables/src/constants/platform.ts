import { version as reactVersion } from 'react';
import { Platform } from 'react-native';

export const IS_WEB = Platform.OS === 'web';

export const IS_REACT_19 = reactVersion.startsWith('19.');

export function isPaper() {
  // @ts-expect-error - globalThis is not typed
  // eslint-disable-next-line no-underscore-dangle
  return !globalThis?._IS_FABRIC && !IS_WEB;
}
