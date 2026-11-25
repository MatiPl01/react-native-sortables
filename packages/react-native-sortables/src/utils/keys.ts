const hasProp = <O extends object, P extends string>(
  object: O,
  prop: P
): object is O & Record<P, unknown> => {
  return prop in object;
};

export const defaultKeyExtractor = <I>(item: I): string => {
  if (typeof item === 'object' && item !== null) {
    if (hasProp(item, 'id')) {
      return String(item.id);
    }
    if (hasProp(item, 'key')) {
      return String(item.key);
    }
  }

  const key = String(item);
  if (key !== '[object Object]') {
    return key;
  }

  // Plain objects all have the same string value, so their content is used
  try {
    return JSON.stringify(item);
  } catch {
    return key;
  }
};
