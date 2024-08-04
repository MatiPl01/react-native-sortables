import * as SortableFlex from '@/examples/SortableFlex';
import * as SortableGrid from '@/examples/SortableGrid';

import type { Routes } from './types';

const routes: Routes = {
  SortableFlex: {
    name: 'SortableFlex',
    routes: {
      PropsExample: {
        component: SortableFlex.PropsExample,
        name: 'SortableFlex Properties'
      }
    }
  },
  SortableGrid: {
    name: 'SortableGrid',
    routes: {
      PropsExample: {
        component: SortableGrid.PropsExample,
        name: 'SortableGrid Properties'
      }
    }
  }
};

export default routes;
