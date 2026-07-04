import { useCallback, useState } from 'react';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import type { SortableGridRenderItem } from 'react-native-sortables';
import Sortable, { useItemContext } from 'react-native-sortables';
import * as ContextMenu from 'zeego/context-menu';

import { GridCard, ScrollScreen, Section, Stagger } from '@/components';
import { spacing } from '@/theme';
import { getItems } from '@/utils';

const DATA = getItems(6);
const COLUMNS = 2;

// The native menu appears on the OS long-press timeout (~500ms) and can't be
// changed, so we tune the sortable side instead: it claims the gesture a bit
// sooner and treats even a small move as a drag, so `isDragging` flips - and the
// menu is dismissed - as soon as the item starts moving. Lower both to make the
// sortable win the long press more eagerly.
const DRAG_ACTIVATION_DELAY = 120; // ms until the item can be dragged (default 200)
const DRAG_FAIL_OFFSET = 3; // px of movement that counts as a drag (default 5)

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

  // Once the item is actually dragged, drop the context menu so it can't open
  // (and it closes if it was already open) - the sortable owns the gesture from
  // that point on. On a stationary long press the menu stays available.
  if (dragging) {
    return <GridCard>{item}</GridCard>;
  }

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>
        <GridCard>{item}</GridCard>
      </ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.Item key='edit'>
          <ContextMenu.ItemTitle>Edit</ContextMenu.ItemTitle>
        </ContextMenu.Item>
        <ContextMenu.Item key='delete' destructive>
          <ContextMenu.ItemTitle>Delete</ContextMenu.ItemTitle>
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
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
          description='Long press an item to open its native context menu; start dragging and the menu is dismissed. Reproduces #417: the sortable must not dismiss or block the menu on a plain long press, but must take over once the item is dragged.'
          title='Items wrapped in a native context menu (zeego)'>
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
