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
      PropsExample: {
        Component: SortableGrid.PropsExample,
        name: 'SortableGrid Properties'
      }
    }
  },
  SortableFlex: {
    CardComponent: SortableFlexCard,
    name: 'SortableFlex',
    routes: {
      PropsExample: {
        Component: SortableFlex.PropsExample,
        name: 'SortableFlex Properties'
      }
    }
  }
};

export default routes;
