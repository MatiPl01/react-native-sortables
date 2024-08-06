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
        name: 'SortableGrid Properties'
      },
      DropIndicator: {
        Component: SortableGrid.DropIndicatorExample,
        name: 'Drop Indicator'
      }
    }
  },
  SortableFlex: {
    CardComponent: SortableFlexCard,
    name: 'SortableFlex',
    routes: {
      Props: {
        Component: SortableFlex.PropsExample,
        name: 'SortableFlex Properties'
      },
      DropIndicator: {
        Component: SortableFlex.DropIndicatorExample,
        name: 'Drop Indicator'
      }
    }
  }
};

export default routes;
