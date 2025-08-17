import { version as reactVersion } from 'react';
import { Platform } from 'react-native';

export const IS_WEB = Platform.OS === 'web';
export const IS_JEST: boolean = !!process.env.JEST_WORKER_ID;
export const IS_WINDOWS: boolean = Platform.OS === 'windows';

export const IS_REACT_19 = reactVersion.startsWith('19.');

export const IS_NATIVE = !IS_JEST && !IS_WEB && !IS_WINDOWS;

export function isFabric() {
  // eslint-disable-next-line no-underscore-dangle
  return !!(globalThis?._IS_FABRIC ?? global?._IS_FABRIC);
}
