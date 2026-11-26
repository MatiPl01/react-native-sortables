import { renderHook } from '@testing-library/react-hooks';
import { TurboModuleRegistry } from 'react-native';

import useHaptics from './useHaptics';

it('triggers haptics when they are enabled after the first render', () => {
  const play = jest.fn();
  jest
    .spyOn(TurboModuleRegistry, 'get')
    // eslint-disable-next-line camelcase -- Pulsar's native Turbo Module method name
    .mockReturnValue({ Pulsar_play: play } as never);

  const { rerender, result } = renderHook(
    ({ enabled }) => useHaptics(enabled),
    { initialProps: { enabled: false } }
  );
  const haptics = result.current;
  haptics.medium();
  expect(play).not.toHaveBeenCalled();

  rerender({ enabled: true });
  haptics.medium();
  expect(play).toHaveBeenCalledWith('SystemImpactMedium');
  // A new object would give the drag handlers a new identity, which ends the
  // active drag and re-runs the cleanup effect of every item
  expect(result.current).toBe(haptics);
});
