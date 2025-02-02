type SortablesError = 'SortablesError' & Error; // signed type

interface SortablesErrorConstructor extends Error {
  new (message?: string): SortablesError;
  (message?: string): SortablesError;
  readonly prototype: SortablesError;
}

// eslint-disable-next-line no-redeclare
const SortablesErrorConstructor: SortablesErrorConstructor =
  function SortablesError(message?: string) {
    'worklet';
    const prefix = '[react-native-sortables]';
    const errorInstance = new Error(message ? `${prefix} ${message}` : prefix);
    errorInstance.name = 'SortablesError';
    return errorInstance;
  } as SortablesErrorConstructor;

export { SortablesErrorConstructor as SortablesError };
