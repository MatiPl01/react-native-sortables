import type { ViewProps } from 'react-native';

import { DefaultDropIndicator } from '../components/defaults';
import type {
  DefaultProps,
  SharedProps,
  SortableCallbacks,
  SortableFlexProps,
  SortableGridProps
} from '../types';
import { defaultKeyExtractor } from '../utils';

export const STYLE_PROPS = ['style', 'dropIndicatorStyle'] as const;

/**
 * DEFAULT SHARED PROPS
 */

type OptionalSharedProps = 'scrollableRef' | keyof SortableCallbacks;

type DefaultSharedProps = DefaultProps<SharedProps, OptionalSharedProps>;

export const DEFAULT_SHARED_PROPS: DefaultSharedProps = {
  DropIndicatorComponent: DefaultDropIndicator,
  activeItemOpacity: 1,
  activeItemScale: 1.1,
  activeItemShadowOpacity: 0.2,
  animateContainerHeight: true,
  autoScrollActivationOffset: 40,
  autoScrollEnabled: true,
  autoScrollSpeed: 1,
  dropIndicatorStyle: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderColor: 'black',
    borderRadius: 10,
    borderStyle: 'dashed',
    borderWidth: 2,
    flex: 1
  },
  enableActiveItemSnap: true,
  enableHaptics: false,
  enableSort: true,
  inactiveItemOpacity: 0.5,
  inactiveItemScale: 1,
  onDragEnd: undefined,
  onDragStart: undefined,
  onOrderChange: undefined,
  reorderStrategy: 'insert',
  scrollableRef: undefined,
  showDropIndicator: false,
  snapOffsetX: '50%',
  snapOffsetY: '50%'
};

/**
 * DEFAULT SORTABLE GRID PROPS
 */
type ExcludedFromDefaultGridProps = 'data' | 'renderItem'; // must be passed by the user

type DefaultSortableGridProps = DefaultProps<
  Omit<SortableGridProps<unknown>, keyof DefaultSharedProps>,
  never,
  ExcludedFromDefaultGridProps
>;

export const DEFAULT_SORTABLE_GRID_PROPS: DefaultSortableGridProps = {
  columnGap: 0,
  columns: 1,
  keyExtractor: defaultKeyExtractor,
  rowGap: 0
};

/**
 * DEFAULT SORTABLE FLEX PROPS
 */
type OptionalDefaultFlexProps = Exclude<keyof ViewProps, 'style'>;

export const DEFAULT_SORTABLE_FLEX_PROPS: DefaultProps<
  Omit<SortableFlexProps, keyof DefaultSharedProps>,
  OptionalDefaultFlexProps
> = {
  // display flex items in a row with wrapping by default
  // (users will expect this behavior in most cases when using SortableFlex)
  style: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  }
};
