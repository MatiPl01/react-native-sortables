import { version as reactVersion } from 'react';
import { Platform } from 'react-native';

export const IS_WEB = Platform.OS === 'web';

export const IS_REACT_19 = reactVersion.startsWith('19.');
