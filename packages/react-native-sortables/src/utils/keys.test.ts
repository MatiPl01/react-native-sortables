import { defaultKeyExtractor } from './keys';

describe(defaultKeyExtractor, () => {
  it('returns the id or the key of an object', () => {
    expect(defaultKeyExtractor({ id: 1, key: 'a' })).toBe('1');
    expect(defaultKeyExtractor({ key: 'a' })).toBe('a');
  });

  it('returns a primitive value as a string', () => {
    expect(defaultKeyExtractor('a')).toBe('a');
    expect(defaultKeyExtractor(1)).toBe('1');
  });

  it('returns different keys for different objects without an id or a key', () => {
    expect(defaultKeyExtractor({ title: 'a' })).not.toBe(
      defaultKeyExtractor({ title: 'b' })
    );
  });

  it('keeps the string value of items that are not plain objects', () => {
    expect(defaultKeyExtractor(['a', 1])).toBe('a,1');
  });

  it('does not throw for an object that cannot be serialized', () => {
    const item: Record<string, unknown> = {};
    item.self = item;

    expect(defaultKeyExtractor(item)).toBe('[object Object]');
  });
});
