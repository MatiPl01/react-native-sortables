import { MenuView } from '@react-native-menu/menu';
import { useCallback, useState } from 'react';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import type { SortableGridRenderItem } from 'react-native-sortables';
import Sortable, { useItemContext } from 'react-native-sortables';

import { GridCard, ScrollScreen, Section, Stagger } from '@/components';
import { spacing } from '@/theme';
import { getItems } from '@/utils';

const DATA = getItems(6);
const COLUMNS = 2;

// The native menu opens on the OS long-press timeout (~500ms, not tunable), so
// tune the sortable side: pick up sooner and treat a small move as a drag.
const DRAG_ACTIVATION_DELAY = 120; // ms until draggable (default 200)
// Small enough that the sortable claims the touch before the surrounding
// ScrollView starts scrolling, but larger than the finger jitter of a
// stationary long press (which must be left to the native context menu).
const DRAG_FAIL_OFFSET = 8; // px of movement that counts as a drag (default 5)

const MENU_ACTIONS = [
  { id: 'edit', title: 'Edit' },
  { attributes: { destructive: true }, id: 'delete', title: 'Delete' }
];

function noop() {
  // Menu actions are no-ops in this example.
}

// Baseline for comparison: the native context menu on a PLAIN view (no
// sortable). Long press it to see how the OS lifts the view and keeps it
// scaled up while the menu is open.
function PlainMenuCard() {
  return (
    // Without an explicit size the native MenuView stretches to fill the row,
    // so the long press triggers anywhere in the container, not just on the
    // card. Size it to the card so the hit area matches what you see.
    <MenuView
      actions={MENU_ACTIONS}
      style={{ alignSelf: 'flex-start', height: 150, width: 150 }}
      title='Plain'
      shouldOpenOnLongPress
      onPressAction={noop}>
      <GridCard height={150} width={150}>
        Plain
      </GridCard>
    </MenuView>
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

  // While dragging, drop the menu so it can't open (and closes if already open).
  // A stationary long press keeps it.
  if (dragging) {
    return <GridCard>{item}</GridCard>;
  }

  return (
    <MenuView
      actions={MENU_ACTIONS}
      title={item}
      shouldOpenOnLongPress
      onPressAction={noop}>
      <GridCard>{item}</GridCard>
    </MenuView>
  );
}

export default function ContextMenuExample() {
  const renderItem = useCallback<SortableGridRenderItem<string>>(
    ({ item }) => <MenuCard item={item} />,
    []
  );

  return (
    <ScrollScreen includeNavBarHeight>
      <Stagger ParentComponent={Sortable.Layer}>
        <Section
          description='Baseline (no sortable): long press this plain view. The OS lifts it and keeps it scaled up while the menu is open. Compare this with the sortable items below.'
          title='Plain view + context menu'>
          <PlainMenuCard />
        </Section>
        <Section
          description='The same native context menu, but each item is a sortable. A long press should behave like the plain card above; a drag should reorder and dismiss the menu.'
          title='Sortable items + context menu'>
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
