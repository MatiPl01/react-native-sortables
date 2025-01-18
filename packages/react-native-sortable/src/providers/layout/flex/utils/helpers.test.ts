import { areDimensionsCorrect } from './helpers';

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
