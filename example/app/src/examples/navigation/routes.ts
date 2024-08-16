/* eslint-disable perfectionist/sort-objects */
import { SortableFlexCard, SortableGridCard } from '@/components';
import * as SortableFlex from '@/examples/SortableFlex';
import * as SortableGrid from '@/examples/SortableGrid';

import type { Routes } from './types';

const routes: Routes = {
  SortableGrid: {
    CardComponent: SortableGridCard,
    name: 'SortableGrid',
    routes: {
      Props: {
        Component: SortableGrid.PropsExample,
        name: 'Properties'
      },
      DropIndicator: {
        Component: SortableGrid.DropIndicatorExample,
        name: 'Drop Indicator'
      },
      AutoScroll: {
        Component: SortableGrid.AutoScrollExample,
        name: 'Auto Scroll'
      },
      DataChange: {
        Component: SortableGrid.DataChangeExample,
        name: 'Data Change'
      }
    }
  },
  SortableFlex: {
    CardComponent: SortableFlexCard,
    name: 'SortableFlex',
    routes: {
      Props: {
        Component: SortableFlex.PropsExample,
        name: 'Properties'
      },
      DropIndicator: {
        Component: SortableFlex.DropIndicatorExample,
        name: 'Drop Indicator'
      },
      AutoScroll: {
        Component: SortableFlex.AutoScrollExample,
        name: 'Auto Scroll'
      },
      DataChange: {
        Component: SortableGrid.DataChangeExample,
        name: 'Data Change'
      }
    }
  }
};

export default routes;
