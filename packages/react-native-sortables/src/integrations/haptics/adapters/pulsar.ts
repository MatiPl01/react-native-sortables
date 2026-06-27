/**
 * Optional react-native-pulsar adapter.
 *
 * Pulsar exposes its haptics through a Turbo Module ('RNPulsar'), so it only
 * works on the New Architecture and never in Expo Go. Like the expo-haptics
 * adapter, we never import the package: we look its native module up in the
 * Turbo Module registry, so Pulsar is used automatically when a consumer has
 * installed it and ignored everywhere else. That keeps it out of the
 * dependency tree and leaves bare old-architecture builds untouched.
 *
 * `Pulsar_play` is synchronous and Pulsar's own presets call it from worklets,
 * so we fire it directly on the UI thread without hopping to JS.
 */

import { type TurboModule, TurboModuleRegistry } from 'react-native';

import type { HapticsAdapter, HapticTrigger } from './types';

// Native preset names backing Pulsar's `Presets.System.impact*` helpers.
const PRESET = {
  impactLight: 'SystemImpactLight',
  impactMedium: 'SystemImpactMedium'
} as const;

interface PulsarModule extends TurboModule {
  Pulsar_play(name: string): void;
}

const load = (): HapticTrigger | null => {
  const pulsar = TurboModuleRegistry.get<PulsarModule>('RNPulsar');

  // Touching the method on the JS thread also primes the prototype cache so it
  // stays callable from the UI worklet (matches Pulsar's own workaround).
  if (!pulsar?.Pulsar_play) {
    return null;
  }

  const trigger: HapticTrigger = (type = 'impactLight') => {
    'worklet';
    // eslint-disable-next-line new-cap -- external Turbo Module method name
    pulsar.Pulsar_play(
      type === 'impactMedium' ? PRESET.impactMedium : PRESET.impactLight
    );
  };

  return trigger;
};

const Pulsar: HapticsAdapter = {
  load,
  name: 'react-native-pulsar'
};

export default Pulsar;
