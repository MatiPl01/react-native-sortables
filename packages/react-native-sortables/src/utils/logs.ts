const LIBRARY_NAME = 'react-native-sortables';

export const logger = {
  error(message: string) {
    'worklet';
    console.error(`[${LIBRARY_NAME}] ${message}`);
  },
  warn(message: string) {
    'worklet';
    console.warn(`[${LIBRARY_NAME}] ${message}`);
  }
};

export const ensureExists = <T>(
  value: T,
  message: string
): value is NonNullable<T> => {
  'worklet';
  if (value === undefined || value === null) {
    logger.warn(message);
  }
  return !!value;
};

export const error = (message: string) => {
  'worklet';
  return new Error(`[${LIBRARY_NAME}] ${message}`);
};
