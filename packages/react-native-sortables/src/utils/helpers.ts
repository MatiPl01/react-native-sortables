import type { AnyFunction } from '../types';

export const markAsInternal = <T extends AnyFunction>(
  fn: T,
  key?: string
): T => {
  Object.defineProperty(fn, '__rns_internal', {
    configurable: false,
    value: key,
    writable: false
  });
  return fn;
};

export const isInternalFunction = <T extends AnyFunction>(
  fn: T,
  key?: string
): boolean => {
  if (typeof fn !== 'function') {
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, no-underscore-dangle, @typescript-eslint/no-unsafe-member-access
  const internalKey = (fn as any).__rns_internal;

  // If no key is provided, just check if the function is marked as internal
  if (key === undefined) {
    return internalKey !== undefined;
  }

  // If a key is provided, check if it matches the internal key
  return internalKey === key;
};
