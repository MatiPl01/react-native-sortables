import { TurboModuleRegistry } from 'react-native';

import Pulsar from './pulsar';

describe('Pulsar haptics adapter', () => {
  const getSpy = jest.spyOn(TurboModuleRegistry, 'get');

  afterEach(() => {
    getSpy.mockReset();
  });

  it('looks the module up by its registered name and bails when absent', () => {
    getSpy.mockReturnValue(null);

    expect(Pulsar.load()).toBeNull();
    expect(getSpy).toHaveBeenCalledWith('RNPulsar');
  });

  it('bails when the module does not expose Pulsar_play', () => {
    getSpy.mockReturnValue({} as never);

    expect(Pulsar.load()).toBeNull();
  });

  it('maps impact types to the matching Pulsar system presets', () => {
    const play = jest.fn();
    // eslint-disable-next-line camelcase -- Pulsar's native Turbo Module method name
    getSpy.mockReturnValue({ Pulsar_play: play } as never);

    const trigger = Pulsar.load();
    expect(trigger).not.toBeNull();

    trigger?.('impactMedium');
    trigger?.('impactLight');
    trigger?.();

    expect(play.mock.calls).toEqual([
      ['SystemImpactMedium'],
      ['SystemImpactLight'],
      ['SystemImpactLight']
    ]);
  });
});
