'worklet';
const LIBRARY_NAME = 'react-native-sortables';

export const logger = {
  error(message: string) {
    console.error(`[${LIBRARY_NAME}] ${message}`);
  },
  warn(message: string) {
    console.warn(`[${LIBRARY_NAME}] ${message}`);
  }
};

export const error = (message: string) =>
  new Error(`[${LIBRARY_NAME}] ${message}`);
