/* eslint-disable perfectionist/sort-objects */
import { SortableFlexCard, SortableGridCard } from '@/components';
import * as SortableFlex from '@/examples/SortableFlex';
import * as SortableGrid from '@/examples/SortableGrid';

import type { Routes } from './types';

const routes: Routes = {
  SortableGrid: {
    CardComponent: SortableGridCard,
    name: 'Sortable Grid',
    routes: {
      Playground: {
        Component: SortableGrid.PlaygroundExample,
        name: 'Playground'
      },
      DropIndicator: {
        Component: SortableGrid.DropIndicatorExample,
        name: 'Drop Indicator'
      },
      DragHandle: {
        Component: SortableGrid.DragHandleExample,
        name: 'Drag Handle'
      },
      AutoScroll: {
        Component: SortableGrid.AutoScrollExample,
        name: 'Auto Scroll'
      },
      DataChange: {
        Component: SortableGrid.DataChangeExample,
        name: 'Data Change'
      },
      OrderingStrategy: {
        Component: SortableGrid.OrderingStrategyExample,
        name: 'Ordering Strategy'
      },
      DifferentSizeItems: {
        Component: SortableGrid.DifferentSizeItems,
        name: 'Different Size Items'
      },
      CallbacksExample: {
        Component: SortableGrid.CallbacksExample,
        name: 'Callbacks'
      },
      DebugExample: {
        Component: SortableGrid.DebugExample,
        name: 'Debug'
      }
    }
  },
  SortableFlex: {
    CardComponent: SortableFlexCard,
    name: 'Sortable Flex',
    routes: {
      Playground: {
        Component: SortableFlex.PlaygroundExample,
        name: 'Playground'
      },
      DropIndicator: {
        Component: SortableFlex.DropIndicatorExample,
        name: 'Drop Indicator'
      },
      DragHandle: {
        Component: SortableFlex.DragHandleExample,
        name: 'Drag Handle'
      },
      AutoScroll: {
        Component: SortableFlex.AutoScrollExample,
        name: 'Auto Scroll'
      },
      HorizontalAutoScroll: {
        Component: SortableFlex.HorizontalAutoScrollExample,
        name: 'Horizontal Auto Scroll'
      },
      DataChange: {
        Component: SortableFlex.DataChangeExample,
        name: 'Data Change'
      },
      FlexLayout: {
        Component: SortableFlex.FlexLayoutExample,
        name: 'Flex Layout'
      },
      CallbacksExample: {
        Component: SortableFlex.CallbacksExample,
        name: 'Callbacks'
      },
      DebugExample: {
        Component: SortableFlex.DebugExample,
        name: 'Debug'
      }
    }
  }
};

export default routes;
