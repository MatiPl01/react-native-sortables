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

  return String(item);
};

export const defaultSortableExtractor = <I>(item: I): boolean => {
  if (typeof item === 'object' && item !== null) {
    if (hasProp(item, 'sortable')) {
      return Boolean(item.sortable);
    }
  }
  return true;
};
