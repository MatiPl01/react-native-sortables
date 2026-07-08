import { createItemsStore } from './store';

type Renderer = (info: { item: string }) => string;

const asRenderItem = (fn: Renderer) => fn as never;

describe('createItemsStore', () => {
  it('renders the initial node from the initial renderer', () => {
    const store = createItemsStore(
      [['a', 'Item a']],
      asRenderItem(({ item }) => `LARGE:${item}`)
    );

    expect(store.getNode('a')).toBe('LARGE:Item a');
  });

  // Regression coverage for the collapsible-items case: when only the
  // renderItem identity changes (e.g. an item collapses on drag), the store
  // must re-render the node and notify subscribers. The teleported active item
  // relies on this notification to shrink together with the source item.
  it('re-renders and notifies when the renderItem identity changes', () => {
    const entries: Array<[string, string]> = [['a', 'Item a']];
    const store = createItemsStore(
      entries,
      asRenderItem(({ item }) => `LARGE:${item}`)
    );

    let notified = 0;
    store.subscribeItem('a', () => {
      notified += 1;
    });

    store.update(
      entries,
      asRenderItem(({ item }) => `SMALL:${item}`)
    );

    expect(notified).toBe(1);
    expect(store.getNode('a')).toBe('SMALL:Item a');
  });

  it('does not re-render when neither data, index nor renderer changes', () => {
    const entries: Array<[string, string]> = [['a', 'Item a']];
    const renderer = asRenderItem(({ item }) => `N:${item}`);
    const store = createItemsStore(entries, renderer);

    let notified = 0;
    store.subscribeItem('a', () => {
      notified += 1;
    });

    store.update(entries, renderer);

    expect(notified).toBe(0);
    expect(store.getNode('a')).toBe('N:Item a');
  });
});
