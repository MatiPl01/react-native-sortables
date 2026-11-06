import { IS_WEB } from '@/constants';

/**
 * Reanimated uses dependencies only on the web, where they let worklets work
 * without the Babel plugin. On native it derives them from the worklet closure
 * and warns when an array is passed (Reanimated 4.7+), so nothing must reach
 * the hook there.
 */
export function webOnlyDependencies(
  ...dependencies: Array<unknown>
): Array<unknown> | undefined {
  return IS_WEB ? dependencies : undefined;
}
