export function noop() {
  // Do nothing
}

export function formatCallbackParams(params: { [key: string]: unknown }) {
  'worklet';
  return JSON.stringify(params, null, 2);
}
