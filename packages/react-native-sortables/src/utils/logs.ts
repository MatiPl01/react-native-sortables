export const ensureExists = <T>(
  value: T,
  message: string
): value is NonNullable<T> => {
  'worklet';
  if (value === undefined || value === null) {
    console.warn(`[react-native-sortables] ${message}`);
  }
  return !!value;
};
