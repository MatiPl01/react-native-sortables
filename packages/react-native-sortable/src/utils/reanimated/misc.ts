import type { SharedValue } from 'react-native-reanimated';

export function maybeUpdateValue(
  target: SharedValue<number>,
  value: number,
  eps = 0.01
): void {
  'worklet';
  if (Math.abs(target.value - value) > eps) {
    target.value = value;
  }
}
