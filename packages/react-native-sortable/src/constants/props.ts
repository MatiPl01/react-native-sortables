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
  autoScrollActivationOffset: 40,
  autoScrollEnabled: true,
  autoScrollSpeed: 1,
  dragEnabled: true,
  enableActiveItemSnap: true,
  hapticsEnabled: false,
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
