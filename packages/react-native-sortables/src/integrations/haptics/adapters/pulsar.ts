/**
 * Optional react-native-pulsar adapter. Pulsar's haptics live behind a Turbo
 * Module ('RNPulsar'), available only on the New Architecture. Like the
 * expo-haptics adapter we never import the package - we look the native module
 * up in the Turbo Module registry, so it is used automatically when installed
 * and adds nothing to the dependency tree. Its presets call the synchronous
 * native method from worklets, so we fire directly on the UI thread.
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
