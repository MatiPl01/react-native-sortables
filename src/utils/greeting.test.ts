import { greet } from './greeting';

describe(greet, () => {
  it('returns greeting', () => {
    expect(greet()).toBe('Hello from the library! 👋');
  });
});
