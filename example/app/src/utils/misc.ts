export function noop() {
  // Do nothing
}

export function formatCallbackParams(params: { [key: string]: unknown }) {
  return JSON.stringify(params, null, 2);
}
