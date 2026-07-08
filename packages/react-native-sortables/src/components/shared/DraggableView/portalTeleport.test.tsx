import { act, render } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';

import { HIDDEN_X_OFFSET } from '../../../constants';
import Sortable from '../../../index';
import ActiveItemPortal from './ActiveItemPortal';
import ItemCell from './ItemCell';

// The teleport calls reanimated measure(), a no-op that warns under jest - silence it.
const originalWarn = console.warn.bind(console);
jest.spyOn(console, 'warn').mockImplementation((...args: Array<unknown>) => {
  if (typeof args[0] === 'string' && args[0].includes('measure()')) return;
  originalWarn(...(args as Parameters<typeof console.warn>));
});

type Root = ReturnType<typeof render>['UNSAFE_root'];

// runOnJS(setTeleported) resolves on the microtask queue, which fake timers don't
// advance; the teleport chains a few nested ticks, so drain several in sequence.
const flushMicrotasks = async () => {
  for (let i = 0; i < 5; i++) {
    // eslint-disable-next-line no-await-in-loop
    await Promise.resolve();
  }
};

function renderGridWithPortal() {
  return render(
    <GestureHandlerRootView>
      <Sortable.PortalProvider>
        <Sortable.Grid
          columns={3}
          data={['a', 'b', 'c']}
          renderItem={({ item }) => (
            <View style={{ height: 50, width: 50 }}>
              <Text>{item}</Text>
            </View>
          )}
        />
      </Sortable.PortalProvider>
    </GestureHandlerRootView>
  );
}

function getActivationProgress(root: Root): SharedValue<number> {
  const progress = root.findAllByType(ActiveItemPortal)[0]?.props
    .activationAnimationProgress as SharedValue<number> | undefined;
  if (!progress) {
    throw new Error('ActiveItemPortal activationAnimationProgress not found');
  }
  return progress;
}

// Source cells carry a boolean `hidden` prop; the teleported copy never does.
function getSourceCells(root: Root) {
  return root
    .findAllByType(ItemCell)
    .filter(node => typeof node.props.hidden === 'boolean');
}

// The reaction teleports only on an increase from a non-null previous, so seed a
// low progress before raising it to 1.
async function activateTeleport(root: Root) {
  const progress = getActivationProgress(root);
  await act(async () => {
    progress.value = 0.01;
    jest.runAllTimers();
    await flushMicrotasks();
  });
  await act(async () => {
    progress.value = 1;
    jest.runAllTimers();
    await flushMicrotasks();
  });
  await act(async () => {
    jest.runAllTimers();
    await flushMicrotasks();
  });
}

function getHiddenSourceInnerStyles(
  root: Root
): Array<Record<string, unknown>> {
  const hiddenSource = getSourceCells(root).find(c => c.props.hidden === true);
  if (!hiddenSource) return [];
  return hiddenSource
    .findAll(
      node =>
        !!node.props?.style &&
        JSON.stringify(node.props.style).includes(String(HIDDEN_X_OFFSET))
    )
    .map(node => node.props.style as Record<string, unknown>);
}

it('teleports exactly one copy and hides the in-grid source', async () => {
  const tree = renderGridWithPortal();
  const root = tree.UNSAFE_root;

  expect(root.findAllByType(ItemCell)).toHaveLength(3);
  expect(getSourceCells(root)).toHaveLength(3);
  expect(getSourceCells(root).some(c => c.props.hidden === true)).toBe(false);

  await activateTeleport(root);

  const allCells = root.findAllByType(ItemCell);
  const sourceCells = getSourceCells(root);
  const teleportedCount = allCells.length - sourceCells.length;

  expect(allCells).toHaveLength(4);
  expect(teleportedCount).toBe(1);
  expect(sourceCells.filter(c => c.props.hidden === true)).toHaveLength(1);

  tree.unmount();
});

it('applies a static opacity:0 (not only left:9999) to the hidden source inner view', async () => {
  const tree = renderGridWithPortal();
  const root = tree.UNSAFE_root;

  await activateTeleport(root);

  const innerStyles = getHiddenSourceInnerStyles(root);
  expect(innerStyles.length).toBeGreaterThan(0);

  const flat = JSON.stringify(innerStyles);
  expect(flat).toContain(`"left":${HIDDEN_X_OFFSET}`);
  expect(flat).toContain('"opacity":0');

  tree.unmount();
});
