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
  result.current.medium();
  expect(play).not.toHaveBeenCalled();

  rerender({ enabled: true });
  result.current.medium();
  expect(play).toHaveBeenCalledWith('SystemImpactMedium');
});
