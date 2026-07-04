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

// The native menu opens on the OS long-press timeout (~500ms, not tunable), so
// tune the sortable side: pick up sooner and treat a small move as a drag.
const DRAG_ACTIVATION_DELAY = 120; // ms until draggable (default 200)
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

  // While dragging, drop the menu so it can't open (and closes if already open).
  // A stationary long press keeps it.
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
