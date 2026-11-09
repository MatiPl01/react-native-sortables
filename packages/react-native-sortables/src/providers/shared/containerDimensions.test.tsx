import { act, render } from '@testing-library/react-native';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';

import Sortable, { useCommonValuesContext } from '../../index';

type Root = ReturnType<typeof render>['UNSAFE_root'];

const ITEM_HEIGHT = 50;
const WIDTH = 300;

let containerHeight: null | SharedValue<null | number> = null;

function ProbeItem() {
  containerHeight = useCommonValuesContext().containerHeight;
  return <View style={{ height: ITEM_HEIGHT }} />;
}

const flushMicrotasks = async () => {
  for (let i = 0; i < 5; i++) {
    // eslint-disable-next-line no-await-in-loop
    await Promise.resolve();
  }
};

/** The item cells, keyed, in mount order. */
function itemCells(root: Root) {
  return root.findAll(
    node =>
      typeof node.props.onLayout === 'function' &&
      typeof node.props.itemKey === 'string'
  );
}

/**
 * The grid's own measured container view. SortableContainer itself also takes an
 * onLayout, but with an (width, height) signature rather than an event, so match
 * on the view props instead: a styled view, outside any item cell.
 */
function containerNode(root: Root) {
  return root.findAll(
    node =>
      typeof node.props.onLayout === 'function' &&
      node.props.style !== undefined &&
      typeof node.props.itemKey !== 'string' &&
      node.props.entering === undefined
  )[0];
}

type LayoutEvent = { nativeEvent: { layout: Record<string, number> } };
type LayoutHandler = (event: LayoutEvent) => void;

const layoutEvent = (height: number): LayoutEvent => ({
  nativeEvent: { layout: { height, width: WIDTH, x: 0, y: 0 } }
});

const layoutHandlerOf = (node?: { props: Record<string, unknown> }) =>
  node?.props.onLayout as LayoutHandler | undefined;

/**
 * Report a layout for exactly the given keys, which is what the native side
 * does: a view that neither moved nor resized gets no onLayout at all.
 */
async function reportLayoutFor(
  root: Root,
  keys: Array<string>,
  height = ITEM_HEIGHT
) {
  await act(async () => {
    layoutHandlerOf(containerNode(root))?.(layoutEvent(height));
    for (const cell of itemCells(root)) {
      if (keys.includes(cell.props.itemKey as string)) {
        layoutHandlerOf(cell)?.(layoutEvent(height));
      }
    }
    jest.runAllTimers();
    await flushMicrotasks();
  });
}

function Grid({ data }: { data: Array<string> }) {
  return (
    <GestureHandlerRootView>
      <Sortable.Grid
        columns={1}
        data={data}
        keyExtractor={item => item}
        renderItem={() => <ProbeItem />}
        rowGap={0}
      />
    </GestureHandlerRootView>
  );
}

describe('grid container height', () => {
  beforeEach(() => {
    containerHeight = null;
  });

  it('is set once every item has been measured', async () => {
    const view = render(<Grid data={['a', 'b', 'c']} />);
    await reportLayoutFor(view.UNSAFE_root, ['a', 'b', 'c']);
    expect(containerHeight?.value).toBe(3 * ITEM_HEIGHT);
  });

  it('grows when an item is appended and only the new item reports a layout', async () => {
    const view = render(<Grid data={['a', 'b', 'c']} />);
    await reportLayoutFor(view.UNSAFE_root, ['a', 'b', 'c']);
    expect(containerHeight?.value).toBe(3 * ITEM_HEIGHT);

    view.rerender(<Grid data={['a', 'b', 'c', 'd']} />);
    // Only 'd' is new; a, b and c neither moved nor resized.
    await reportLayoutFor(view.UNSAFE_root, ['d']);
    expect(containerHeight?.value).toBe(4 * ITEM_HEIGHT);
  });

  it('shrinks when an item is removed and nothing reports a layout', async () => {
    const view = render(<Grid data={['a', 'b', 'c']} />);
    await reportLayoutFor(view.UNSAFE_root, ['a', 'b', 'c']);

    view.rerender(<Grid data={['a', 'b']} />);
    // Removing the last item resizes nothing that remains.
    await reportLayoutFor(view.UNSAFE_root, []);
    expect(containerHeight?.value).toBe(2 * ITEM_HEIGHT);
  });

  it('keeps updating after an item is replaced', async () => {
    const view = render(<Grid data={['a', 'b', 'c']} />);
    await reportLayoutFor(view.UNSAFE_root, ['a', 'b', 'c']);

    view.rerender(<Grid data={['a', 'b', 'd']} />);
    await reportLayoutFor(view.UNSAFE_root, ['d']);
    expect(containerHeight?.value).toBe(3 * ITEM_HEIGHT);

    view.rerender(<Grid data={['a', 'b', 'd', 'e']} />);
    await reportLayoutFor(view.UNSAFE_root, ['e']);
    expect(containerHeight?.value).toBe(4 * ITEM_HEIGHT);
  });

  it('keeps updating when an item is removed and another added in the same commit', async () => {
    const view = render(<Grid data={['a', 'b', 'c', 'd']} />);
    await reportLayoutFor(view.UNSAFE_root, ['a', 'b', 'c', 'd']);
    expect(containerHeight?.value).toBe(4 * ITEM_HEIGHT);

    // swap one out for one in, net count unchanged
    view.rerender(<Grid data={['a', 'b', 'c', 'e']} />);
    await reportLayoutFor(view.UNSAFE_root, ['e']);
    expect(containerHeight?.value).toBe(4 * ITEM_HEIGHT);

    view.rerender(<Grid data={['a', 'b', 'c', 'e', 'f']} />);
    await reportLayoutFor(view.UNSAFE_root, ['f']);
    expect(containerHeight?.value).toBe(5 * ITEM_HEIGHT);
  });

  it('keeps updating after a late layout event for an item that was removed', async () => {
    const view = render(<Grid data={['a', 'b', 'c']} />);
    await reportLayoutFor(view.UNSAFE_root, ['a', 'b', 'c']);
    expect(containerHeight?.value).toBe(3 * ITEM_HEIGHT);

    // Hold on to c's layout handler, then remove c from the data.
    const staleOnLayout = layoutHandlerOf(
      itemCells(view.UNSAFE_root).find(cell => cell.props.itemKey === 'c')
    );
    view.rerender(<Grid data={['a', 'b']} />);
    await reportLayoutFor(view.UNSAFE_root, []);
    expect(containerHeight?.value).toBe(2 * ITEM_HEIGHT);

    // The native side delivers a layout event that was already queued for the
    // now-unmounted cell.
    await act(async () => {
      staleOnLayout?.(layoutEvent(ITEM_HEIGHT + 7));
      jest.runAllTimers();
      await flushMicrotasks();
    });

    // The grid must still react to later data changes.
    view.rerender(<Grid data={['a', 'b', 'd']} />);
    await reportLayoutFor(view.UNSAFE_root, ['d']);
    expect(containerHeight?.value).toBe(3 * ITEM_HEIGHT);
  });

  it('commits a queued measurement when the item it was waiting for is removed', async () => {
    const view = render(<Grid data={['a', 'b', 'c']} />);
    // a and b report a layout; c never does, so the batch stays incomplete.
    await reportLayoutFor(view.UNSAFE_root, ['a', 'b']);
    expect(containerHeight?.value).toBeNull();

    // Removing the item the batch was waiting for completes it.
    view.rerender(<Grid data={['a', 'b']} />);
    await reportLayoutFor(view.UNSAFE_root, []);
    expect(containerHeight?.value).toBe(2 * ITEM_HEIGHT);
  });

  it('does not resurrect a removed item from a queued measurement', async () => {
    const view = render(<Grid data={['a', 'b', 'c']} />);
    // a and b are queued while c is still unmeasured.
    await reportLayoutFor(view.UNSAFE_root, ['a', 'b']);

    // b leaves before the batch is flushed.
    view.rerender(<Grid data={['a', 'c']} />);
    await reportLayoutFor(view.UNSAFE_root, ['c']);
    expect(containerHeight?.value).toBe(2 * ITEM_HEIGHT);

    // b comes back; the grid must still account for it.
    view.rerender(<Grid data={['a', 'c', 'b']} />);
    await reportLayoutFor(view.UNSAFE_root, ['b']);
    expect(containerHeight?.value).toBe(3 * ITEM_HEIGHT);
  });

  it('keeps updating after a removed key is added back', async () => {
    const view = render(<Grid data={['a', 'b', 'c']} />);
    await reportLayoutFor(view.UNSAFE_root, ['a', 'b', 'c']);

    view.rerender(<Grid data={['a', 'b']} />);
    await reportLayoutFor(view.UNSAFE_root, []);
    expect(containerHeight?.value).toBe(2 * ITEM_HEIGHT);

    // same key comes back with the same size it had before
    view.rerender(<Grid data={['a', 'b', 'c']} />);
    await reportLayoutFor(view.UNSAFE_root, ['c']);
    expect(containerHeight?.value).toBe(3 * ITEM_HEIGHT);
  });
});

function Flex({ items }: { items: Array<string> }) {
  return (
    <GestureHandlerRootView>
      <Sortable.Flex gap={0}>
        {items.map(item => (
          <View key={item} style={styles.flexItem}>
            <ProbeItem />
          </View>
        ))}
      </Sortable.Flex>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flexItem: {
    height: ITEM_HEIGHT,
    width: WIDTH
  }
});

// SortableFlex goes through the same MeasurementsProvider, so the stale and
// stranded measurement paths have to hold there too.
// SortableFlex derives item keys from the React child keys, so a child keyed
// "a" is tracked as ".$a".
const flexKeys = (...names: Array<string>) => names.map(name => `.$${name}`);

describe('flex container height', () => {
  beforeEach(() => {
    containerHeight = null;
  });

  it('is set once every item has been measured', async () => {
    const view = render(<Flex items={['a', 'b', 'c']} />);
    await reportLayoutFor(view.UNSAFE_root, flexKeys('a', 'b', 'c'));
    expect(containerHeight?.value).toBe(3 * ITEM_HEIGHT);
  });

  it('grows when an item is appended', async () => {
    const view = render(<Flex items={['a', 'b', 'c']} />);
    await reportLayoutFor(view.UNSAFE_root, flexKeys('a', 'b', 'c'));

    view.rerender(<Flex items={['a', 'b', 'c', 'd']} />);
    await reportLayoutFor(view.UNSAFE_root, flexKeys('d'));
    expect(containerHeight?.value).toBe(4 * ITEM_HEIGHT);
  });

  it('keeps updating after a late layout event for an item that was removed', async () => {
    const view = render(<Flex items={['a', 'b', 'c']} />);
    await reportLayoutFor(view.UNSAFE_root, flexKeys('a', 'b', 'c'));

    const staleOnLayout = layoutHandlerOf(
      itemCells(view.UNSAFE_root).find(cell => cell.props.itemKey === '.$c')
    );
    view.rerender(<Flex items={['a', 'b']} />);
    await reportLayoutFor(view.UNSAFE_root, []);

    await act(async () => {
      staleOnLayout?.(layoutEvent(ITEM_HEIGHT + 7));
      jest.runAllTimers();
      await flushMicrotasks();
    });

    view.rerender(<Flex items={['a', 'b', 'd']} />);
    await reportLayoutFor(view.UNSAFE_root, flexKeys('d'));
    expect(containerHeight?.value).toBe(3 * ITEM_HEIGHT);
  });

  it('commits a queued measurement when the item it was waiting for is removed', async () => {
    const view = render(<Flex items={['a', 'b', 'c']} />);
    await reportLayoutFor(view.UNSAFE_root, flexKeys('a', 'b'));

    view.rerender(<Flex items={['a', 'b']} />);
    await reportLayoutFor(view.UNSAFE_root, []);
    expect(containerHeight?.value).toBe(2 * ITEM_HEIGHT);
  });
});
