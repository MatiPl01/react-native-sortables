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
});
