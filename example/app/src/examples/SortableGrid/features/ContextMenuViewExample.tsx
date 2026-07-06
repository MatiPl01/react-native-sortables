// Sortable grid items with a native iOS context menu (react-native-context-menu-view).
// Long press lifts the item and opens the menu (it stays open); a drag reorders
// and dismisses it.
//
// iOS lift caveat: the library portals the item's LIVE view into the lift. Under
// the New Architecture, when the sortable re-lays that view out mid-interaction
// the OS tears the lift down (item goes blank, or snaps back). To avoid that this
// example (a) passes a separate static `preview` view and (b) relies on a patch to
// the library (see .yarn/patches) so the highlight lifts that static view too,
// not the live one. Known remaining nuance: the lifted sortable item still shows a
// small scale-down settle on commit that a plain (non-sortable) view does not;
// fully removing it would need reworking how the sortable's activation coexists
// with the OS lift (or a drag-handle UX - long press = menu, handle = reorder).
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import ContextMenu from 'react-native-context-menu-view';
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

function noop() {}

// Baseline (no sortable): react-native-context-menu-view uses the real
// UIContextMenuInteraction, so the view lifts and stays scaled up while the
// menu is open (unlike @react-native-menu/menu).
function PlainMenuCard() {
  return (
    // `preview` renders a SEPARATE static view for the lift. Our patched build of
    // react-native-context-menu-view uses it for the highlight too (not just the
    // commit), so the lift never portals the live RN view - it stays put and
    // grows, immune to whatever the host does to the real view.
    <ContextMenu
      actions={MENU_ACTIONS}
      borderRadius={radius.sm}
      disableShadow
      onPress={noop}
      preview={
        <GridCard height={150} width={150}>
          Plain
        </GridCard>
      }
      previewBackgroundColor='transparent'
      style={{ alignSelf: 'flex-start' }}>
      <GridCard height={150} width={150}>
        Plain
      </GridCard>
    </ContextMenu>
  );
}

function MenuCard({ item }: { item: string }) {
  const { isDragging } = useItemContext();
  const [dragging, setDragging] = useState(false);
  // Measure the cell so the lifted preview matches the item's size. Measure on a
  // plain RN View (onLayout fires reliably), NOT on the native ContextMenu: its
  // legacy-interop onLayout doesn't fire dependably on the New Architecture, so
  // the size stayed null, the preview was undefined, and the OS fell back to
  // lifting the live view -> the sortable snapped it.
  const [size, setSize] = useState<{ height: number; width: number }>({
    // Fallback so the preview is NEVER undefined (an undefined preview forces
    // the live-view fallback). Real size overwrites this on first layout.
    height: 170,
    width: 170
  });

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
    // unmount it (its native subview would go nil mid-interaction and crash).
    // `preview` is a SEPARATE static view; the patched library lifts THAT for
    // both the highlight and the commit, so the sortable re-laying out the live
    // item view never disturbs the lift (no blank, no snap-back).
    <ContextMenu
      actions={MENU_ACTIONS}
      borderRadius={radius.sm}
      disableShadow
      disabled={dragging}
      onPress={noop}
      preview={
        <GridCard height={size.height} width={size.width}>
          {item}
        </GridCard>
      }
      previewBackgroundColor='transparent'>
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
