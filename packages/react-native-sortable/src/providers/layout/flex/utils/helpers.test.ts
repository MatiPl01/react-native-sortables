import { areDimensionsCorrect, calculateReferenceSize } from './helpers';

describe(areDimensionsCorrect, () => {
  it('returns true if both dimensions are non-negative', () => {
    expect(areDimensionsCorrect({ height: 100, width: 100 })).toBe(true);
    expect(areDimensionsCorrect({ height: 0, width: 0 })).toBe(true);
  });

  it('returns false if either dimension is negative', () => {
    expect(areDimensionsCorrect({ height: -100, width: 100 })).toBe(false);
    expect(areDimensionsCorrect({ height: 100, width: -100 })).toBe(false);
    expect(areDimensionsCorrect({ height: -100, width: -100 })).toBe(false);
  });
});

describe(calculateReferenceSize, () => {
  it('returns undefined if all sizes are undefined', () => {
    expect(calculateReferenceSize(undefined, undefined, undefined, 100)).toBe(
      undefined
    );
  });

  describe('returns correct size if dimensions are specified', () => {
    it.each([
      // Single dimension
      [[undefined, 100, undefined, 500], 100],
      [[100, undefined, undefined, 500], 100],
      [[undefined, undefined, 100, 500], undefined],
      // Two dimensions
      [[undefined, 100, 200, 500], 100],
      [[undefined, 200, 100, 500], 100],
      [[100, 200, undefined, 500], 200],
      [[200, 100, undefined, 500], 200],
      [[100, undefined, 200, 500], 100],
      [[200, undefined, 100, 500], 200],
      // Three dimensions
      [[300, 100, 200, 500], 300],
      [[100, 300, 200, 500], 200],
      [[100, 200, 300, 500], 200]
    ])('for %s returns %s', ([min, current, max, parent], expected) => {
      expect(calculateReferenceSize(min, current, max, parent!)).toBe(expected);
    });
  });
});
