// Grid cards with a native iOS context menu (react-native-context-menu-view).
// Long press a card and the OS lifts it and opens the menu (it stays open); a
// drag reorders. Active drag-reorder and the native lift fundamentally fight -
// the drag arms on the long press and the OS cancels that touch when the menu
// commits - so the card shows a small scale-down settle as the menu opens.
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import ContextMenu from 'react-native-context-menu-view';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import type { SortableGridRenderItem } from 'react-native-sortables';
import Sortable, { useItemContext } from 'react-native-sortables';

import { GridCard, Section } from '@/components';
import { radius, spacing } from '@/theme';
import { getItems } from '@/utils';

const DATA = getItems(6);
const COLUMNS = 2;

// The native menu opens on the OS long-press timeout (~500ms, not tunable), so
// tune the sortable side: pick up sooner and treat a small move as a drag.
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
  // Grid cards stretch to fill their cell (no explicit size). When the OS lifts
  // such a card for the preview it has nothing to size against and collapses to
  // nothing (the card "disappears"), so render an explicitly sized `preview`.
  // Measure the cell on a plain wrapper View - onLayout fires reliably there -
  // and mirror that size into the preview card.
  const [size, setSize] = useState({ height: 170, width: 170 });

  useAnimatedReaction(
    () => isDragging.value,
    (value, prev) => {
      if (value !== prev) {
        runOnJS(setDragging)(value);
      }
    }
  );

  return (
    // Keep the ContextMenu mounted and just disable it while dragging - a
    // stationary long press keeps the menu; a drag drops it (and reorders).
    <ContextMenu
      actions={MENU_ACTIONS}
      borderRadius={radius.sm}
      disabled={dragging}
      previewBackgroundColor='transparent'
      preview={
        <GridCard height={size.height} width={size.width}>
          {item}
        </GridCard>
      }
      disableShadow
      onPress={noop}>
      <View
        onLayout={({ nativeEvent: { layout } }) =>
          setSize({ height: layout.height, width: layout.width })
        }>
        <GridCard>{item}</GridCard>
      </View>
    </ContextMenu>
  );
}

export default function ContextMenuViewExample() {
  const renderItem = useCallback<SortableGridRenderItem<string>>(
    ({ item }) => <MenuCard item={item} />,
    []
  );

  return (
    <>
      <Section
        description='Baseline (no sortable) using react-native-context-menu-view. Long press the card - the OS lifts it and keeps it scaled up (native UIContextMenuInteraction preview).'
        title='Plain view + native context menu'>
        <PlainMenuCard />
      </Section>
      <Section
        description='Native context menu on sortable grid cards. Long press lifts a card and opens the menu; a drag reorders. The card settles with a small scale-down as the menu commits - the native lift and active drag-reorder fight over the same long press.'
        title='Sortable cards + native context menu'>
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
    </>
  );
}
