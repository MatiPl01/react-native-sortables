// Sortable grid items with a native iOS context menu (react-native-context-menu-view).
// Long press lifts the item and opens the menu (it stays open); a drag reorders
// and dismisses it.
//
// iOS lift nuance: the library lifts the item's live view for the menu preview.
// A plain view lifts and stays scaled up; a sortable item - whose view the
// sortable re-lays out as the gesture ends - shows a small scale-down settle as
// the menu commits. Removing it entirely would need the library (or the sortable)
// to lift a detached snapshot rather than the live view, or a drag-handle UX
// (long press = menu, a handle = reorder). Left as a known nuance here.
import { useCallback, useState } from 'react';
import ContextMenu from 'react-native-context-menu-view';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import type { SortableGridRenderItem } from 'react-native-sortables';
import Sortable, { useItemContext } from 'react-native-sortables';

import { GridCard, ScrollScreen, Section, Stagger } from '@/components';
import { radius, spacing } from '@/theme';
import { getItems } from '@/utils';

const DATA = getItems(6);
const COLUMNS = 2;

const DRAG_ACTIVATION_DELAY = 120; // ms until draggable (default 200)
const DRAG_FAIL_OFFSET = 8; // px of movement that counts as a drag (default 5)

const MENU_ACTIONS = [
  { systemIcon: 'pencil', title: 'Edit' },
  { destructive: true, systemIcon: 'trash', title: 'Delete' }
];

function noop() {
  // Menu actions are no-ops in this example.
}

// Baseline (no sortable): the native menu lifts the card and keeps it scaled up
// while the menu is open.
function PlainMenuCard() {
  return (
    <ContextMenu
      actions={MENU_ACTIONS}
      borderRadius={radius.sm}
      previewBackgroundColor='transparent'
      style={{ alignSelf: 'flex-start' }}
      disableShadow
      onPress={noop}>
      <GridCard height={150} width={150}>
        Plain
      </GridCard>
    </ContextMenu>
  );
}

function MenuCard({ item }: { item: string }) {
  const { isDragging } = useItemContext();
  const [dragging, setDragging] = useState(false);

  useAnimatedReaction(
    () => isDragging.value,
    (value, prev) => {
      if (value !== prev) {
        runOnJS(setDragging)(value);
      }
    }
  );

  return (
    // Keep the ContextMenu mounted and just disable it while dragging - do NOT
    // unmount it, or its native subview goes nil mid-interaction and the library
    // crashes trying to lift it.
    <ContextMenu
      actions={MENU_ACTIONS}
      borderRadius={radius.sm}
      disabled={dragging}
      previewBackgroundColor='transparent'
      disableShadow
      onPress={noop}>
      <GridCard>{item}</GridCard>
    </ContextMenu>
  );
}

export default function ContextMenuViewExample() {
  const renderItem = useCallback<SortableGridRenderItem<string>>(
    ({ item }) => <MenuCard item={item} />,
    []
  );

  return (
    <ScrollScreen includeNavBarHeight>
      <Stagger ParentComponent={Sortable.Layer}>
        <Section
          description='Baseline (no sortable) using react-native-context-menu-view. Long press the card - the OS lifts it and keeps it scaled up (native UIContextMenuInteraction preview).'
          title='Plain view + native context menu'>
          <PlainMenuCard />
        </Section>
        <Section
          description='The same native context menu, but each item is a sortable. A long press should lift the item like the plain card above; a drag should reorder and dismiss the menu.'
          title='Sortable items + native context menu'>
          <Sortable.Grid
            columnGap={spacing.xs}
            columns={COLUMNS}
            data={DATA}
            dragActivationDelay={DRAG_ACTIVATION_DELAY}
            dragActivationFailOffset={DRAG_FAIL_OFFSET}
            renderItem={renderItem}
            rowGap={spacing.xs}
          />
        </Section>
      </Stagger>
    </ScrollScreen>
  );
}
