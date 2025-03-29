export function noop() {
  // Do nothing
}

export function formatCallbackResult(
  name: string,
  params: { [key: string]: unknown }
) {
  'worklet';
  return `[${_WORKLET ? 'UI' : 'JS'}] ${name}: ${JSON.stringify(params, null, 2)}`;
}
