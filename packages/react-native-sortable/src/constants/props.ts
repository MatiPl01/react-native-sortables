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
import { SortableItemEntering, SortableItemExiting } from './layoutAnimations';

export const STYLE_PROPS = ['style', 'dropIndicatorStyle'] as const;

/**
 * DEFAULT SHARED PROPS
 */

type OptionalSharedProps = 'scrollableRef' | keyof SortableCallbacks;

type DefaultSharedProps = DefaultProps<SharedProps, OptionalSharedProps>;

export const DEFAULT_SHARED_PROPS = {
  DropIndicatorComponent: DefaultDropIndicator,
  activeItemOpacity: 1,
  activeItemScale: 1.1,
  activeItemShadowOpacity: 0.2,
  autoScrollActivationOffset: 40,
  autoScrollEnabled: true,
  autoScrollSpeed: 1,
  debug: false,
  dropIndicatorStyle: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderColor: 'black',
    borderRadius: 10,
    borderStyle: 'dashed',
    borderWidth: 2,
    flex: 1
  },
  enableActiveItemSnap: true,
  hapticsEnabled: false,
  inactiveItemOpacity: 0.5,
  inactiveItemScale: 1,
  itemEntering: SortableItemEntering,
  itemExiting: SortableItemExiting,
  onDragEnd: undefined,
  onDragStart: undefined,
  onOrderChange: undefined,
  reorderStrategy: 'insert',
  scrollableRef: undefined,
  showDropIndicator: false,
  snapOffsetX: '50%',
  snapOffsetY: '50%',
  sortEnabled: true
} satisfies DefaultSharedProps;

/**
 * DEFAULT SORTABLE GRID PROPS
 */
type ExcludedFromDefaultGridProps = 'data' | 'renderItem'; // must be passed by the user

type DefaultSortableGridProps = DefaultProps<
  Omit<SortableGridProps<unknown>, keyof DefaultSharedProps>,
  never,
  ExcludedFromDefaultGridProps
>;

export const DEFAULT_SORTABLE_GRID_PROPS = {
  columnGap: 0,
  columns: 1,
  keyExtractor: defaultKeyExtractor,
  rowGap: 0
} satisfies DefaultSortableGridProps;

/**
 * DEFAULT SORTABLE FLEX PROPS
 */
type OptionalDefaultFlexProps = Exclude<keyof ViewProps, 'style'>;

export const DEFAULT_SORTABLE_FLEX_PROPS = {
  // display flex items in a row with wrapping by default
  // (users will expect this behavior in most cases when using SortableFlex)
  style: {
    alignContent: 'flex-start',
    alignItems: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 0,
    justifyContent: 'flex-start'
  }
} satisfies DefaultProps<
  Omit<SortableFlexProps, keyof DefaultSharedProps>,
  OptionalDefaultFlexProps
>;
