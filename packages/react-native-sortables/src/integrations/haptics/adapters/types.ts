export type HapticType = 'impactLight' | 'impactMedium';

/** Worklet-safe haptic trigger, fired on the UI thread. */
export type HapticTrigger = (type?: HapticType) => void;

/**
 * A haptics backend. `load` returns a trigger when the backing library is
 * available at runtime, or `null` so the next adapter in the registry can
 * take over.
 */
export type HapticsAdapter = {
  name: string;
  load: () => HapticTrigger | null;
};
