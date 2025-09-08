import type { ReactNode } from 'react';

import type { RenderItem } from '../../../types';

export type Store<I> = {
  getKeys: () => Array<string>;
  subscribeKeys: (listener: () => void) => () => void;

  getNode: (key: string) => ReactNode | undefined;
  subscribeItem: (key: string, listener: () => void) => () => void;

  update: (
    entries: Array<[key: string, item: I]>,
    renderItem?: RenderItem<I>
  ) => void;
};

const shallowEq = (a: Array<string>, b: Array<string>) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

export function createItemsStore<I>(
  initialItems?: Array<[string, I]>,
  initialRenderItem?: RenderItem<I>
): Store<I> {
  let keys: Array<string> = [];
  const nodes = new Map<string, ReactNode>();
  const meta = new Map<string, { item: I; index: number }>();

  const keyListeners = new Set<() => void>();
  const itemListeners = new Map<string, Set<() => void>>();

  // Track the renderer to detect changes
  let currentRenderer: RenderItem<I> | undefined = initialRenderItem;

  const getKeys = () => keys;
  const getNode = (key: string) => nodes.get(key);

  const subscribeKeys = (listener: () => void) => {
    keyListeners.add(listener);
    return () => keyListeners.delete(listener);
  };

  const subscribeItem = (key: string, listener: () => void) => {
    let set = itemListeners.get(key);
    if (!set) itemListeners.set(key, (set = new Set()));
    set.add(listener);
    return () => {
      set.delete(listener);
      if (!set.size) itemListeners.delete(key);
    };
  };

  // Core logic for init + updates
  function apply(
    entries: Array<[string, I]>,
    renderItem?: RenderItem<I>,
    notify = true
  ) {
    const nextKeys = entries.map(([k]) => k);
    const keysChanged = !shallowEq(keys, nextKeys);

    // If renderer changed, we’ll force-recompute all items
    const rendererChanged = renderItem !== currentRenderer;
    currentRenderer = renderItem;

    if (keysChanged) {
      const nextSet = new Set(nextKeys);
      for (const k of keys) {
        if (!nextSet.has(k)) {
          meta.delete(k);
          nodes.delete(k);
        }
      }
      keys = nextKeys;
    }

    const touched = new Set<string>();

    entries.forEach(([k, item], index) => {
      const prev = meta.get(k);
      const changed =
        rendererChanged || !prev || prev.item !== item || prev.index !== index;

      if (!changed) return;

      const info = { index, item };
      meta.set(k, info);
      nodes.set(k, renderItem ? renderItem(info) : (item as ReactNode));
      touched.add(k);
    });

    if (!notify) return;

    if (keysChanged) keyListeners.forEach(fn => fn());
    touched.forEach(k => {
      const subs = itemListeners.get(k);
      if (subs) subs.forEach(fn => fn());
    });
  }

  // Initial snapshot (sync), no notifications
  if (initialItems) apply(initialItems, initialRenderItem, false);

  const update: Store<I>['update'] = (entries, renderItem) =>
    apply(entries, renderItem, true);

  return { getKeys, getNode, subscribeItem, subscribeKeys, update };
}
