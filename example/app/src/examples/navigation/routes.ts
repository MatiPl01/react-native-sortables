/* eslint-disable perfectionist/sort-objects */
import { SortableFlexCard, SortableGridCard } from '@/components';
import { IS_WEB } from '@/constants';
import * as SortableFlex from '@/examples/SortableFlex';
import * as SortableGrid from '@/examples/SortableGrid';

import type { Routes } from './types';

const routes: Routes = {
  SortableGrid: {
    CardComponent: SortableGridCard,
    name: 'Sortable Grid',
    flatten: true,
    routes: {
      Playground: {
        Component: SortableGrid.PlaygroundExample,
        name: 'Playground'
      },
      Features: {
        name: 'Features',
        routes: {
          DropIndicator: {
            Component: SortableGrid.features.DropIndicatorExample,
            name: 'Drop Indicator'
          },
          DragHandle: {
            Component: SortableGrid.features.DragHandleExample,
            name: 'Drag Handle'
          },
          DataChange: {
            Component: SortableGrid.features.DataChangeExample,
            name: 'Data Change'
          },
          DifferentSizeItems: {
            Component: SortableGrid.features.DifferentSizeItems,
            name: 'Different Size Items'
          },
          AutoScroll: {
            Component: SortableGrid.features.AutoScrollExample,
            name: 'Auto Scroll'
          },
          HorizontalGridAutoscroll: {
            Component: SortableGrid.features.HorizontalAutoScrollExample,
            name: 'Horizontal Grid & Auto Scroll'
          },
          OrderingStrategy: {
            Component: SortableGrid.features.OrderingStrategyExample,
            name: 'Ordering Strategy'
          },
          FixedItems: {
            Component: SortableGrid.features.FixedItemsExample,
            name: 'Fixed Items'
          },
          MultiZone: {
            Component: SortableGrid.features.MultiZoneExample,
            name: 'Multi Zone'
          },
          Callbacks: {
            Component: SortableGrid.features.CallbacksExample,
            name: 'Callbacks'
          },
          Touchable: {
            Component: SortableGrid.features.TouchableExample,
            name: 'Touchable'
          },
          Debug: {
            Component: SortableGrid.features.DebugExample,
            name: 'Debug'
          }
        }
      },
      ...(!IS_WEB && {
        Miscellaneous: {
          name: 'Miscellaneous',
          routes: {
            StaggerAnimation: {
              Component: SortableGrid.miscellaneous.StaggerAnimationExample,
              name: 'Stagger Animation'
            }
          }
        }
      }),
      Tests: {
        name: 'Test examples',
        routes: {
          BottomTabsNavigator: {
            Component: SortableGrid.tests.BottomTabsNavigatorExample,
            name: 'Bottom Tabs Navigator'
          }
        }
      }
    }
  },
  SortableFlex: {
    CardComponent: SortableFlexCard,
    name: 'Sortable Flex',
    flatten: true,
    routes: {
      Playground: {
        Component: SortableFlex.PlaygroundExample,
        name: 'Playground'
      },
      Features: {
        name: 'Features',
        routes: {
          DropIndicator: {
            Component: SortableFlex.features.DropIndicatorExample,
            name: 'Drop Indicator'
          },
          DragHandle: {
            Component: SortableFlex.features.DragHandleExample,
            name: 'Drag Handle'
          },
          DataChange: {
            Component: SortableFlex.features.DataChangeExample,
            name: 'Data Change'
          },
          FlexLayout: {
            Component: SortableFlex.features.FlexLayoutExample,
            name: 'Flex Layout'
          },
          AutoScroll: {
            Component: SortableFlex.features.AutoScrollExample,
            name: 'Auto Scroll'
          },
          HorizontalAutoScroll: {
            Component: SortableFlex.features.HorizontalAutoScrollExample,
            name: 'Horizontal Auto Scroll'
          },
          Callbacks: {
            Component: SortableFlex.features.CallbacksExample,
            name: 'Callbacks'
          },
          Touchable: {
            Component: SortableFlex.features.TouchableExample,
            name: 'Touchable'
          },
          Debug: {
            Component: SortableFlex.features.DebugExample,
            name: 'Debug'
          }
        }
      },
      Tests: {
        name: 'Test examples',
        routes: {
          ComplexLayout: {
            Component: SortableFlex.tests.ComplexLayoutExample,
            name: 'Complex Layout'
          },
          BottomTabsNavigator: {
            Component: SortableFlex.tests.BottomTabsNavigatorExample,
            name: 'Bottom Tabs Navigator'
          }
        }
      }
    }
  }
};

export default routes;
