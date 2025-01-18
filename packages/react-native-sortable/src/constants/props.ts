import type { ViewStyle } from 'react-native';

import { DefaultDropIndicator } from '../components/defaults';
import type {
  DefaultProps,
  SharedProps,
  SortableCallbacks,
  SortableFlexProps,
  SortableGridProps
} from '../types';
import { defaultKeyExtractor } from '../utils/keys';
import { SortableItemEntering, SortableItemExiting } from './layoutAnimations';

export const STYLE_PROPS = ['style', 'dropIndicatorStyle'] as const;

/**
 * DEFAULT SHARED PROPS
 */
type OptionalSharedProps =
  | 'scrollableRef'
  | keyof Omit<SortableCallbacks, 'onDragEnd'>;

type DefaultSharedProps = DefaultProps<SharedProps, OptionalSharedProps>;

export const DEFAULT_SHARED_PROPS = {
  DropIndicatorComponent: DefaultDropIndicator,
  activeItemOpacity: 1,
  activeItemScale: 1.1,
  activeItemShadowOpacity: 0.2,
  animateHeight: false,
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
  } as ViewStyle,
  enableActiveItemSnap: true,
  hapticsEnabled: false,
  inactiveItemOpacity: 0.5,
  inactiveItemScale: 1,
  itemEntering: SortableItemEntering,
  itemExiting: SortableItemExiting,
  onDragStart: undefined,
  onOrderChange: undefined,
  scrollableRef: undefined,
  showDropIndicator: false,
  snapOffsetX: '50%',
  snapOffsetY: '50%',
  sortEnabled: true
} satisfies DefaultSharedProps;

/**
 * DEFAULT SORTABLE GRID PROPS
 */
type ExcludedFromDefaultGridProps = 'data' | 'onDragEnd' | 'renderItem';

type DefaultSortableGridProps = DefaultProps<
  Omit<SortableGridProps<unknown>, keyof DefaultSharedProps>,
  never,
  ExcludedFromDefaultGridProps
>;

export const DEFAULT_SORTABLE_GRID_PROPS = {
  columnGap: 0,
  columns: 1,
  keyExtractor: defaultKeyExtractor,
  rowGap: 0,
  strategy: 'insert'
} satisfies DefaultSortableGridProps;

/**
 * DEFAULT SORTABLE FLEX PROPS
 */
type OptionalDefaultFlexProps =
  | 'children'
  | 'columnGap'
  | 'height'
  | 'maxHeight'
  | 'maxWidth'
  | 'minHeight'
  | 'minWidth'
  | 'rowGap'
  | 'width';

type ExcludedFromDefaultFlexProps = 'onDragEnd';

type DefaultSortableFlexProps = DefaultProps<
  Omit<SortableFlexProps, keyof DefaultSharedProps>,
  OptionalDefaultFlexProps,
  ExcludedFromDefaultFlexProps
>;

export const DEFAULT_SORTABLE_FLEX_PROPS = {
  alignContent: 'flex-start',
  alignItems: 'flex-start',
  // display flex items in a row with wrapping by default
  // (users will expect this behavior in most cases when using SortableFlex)
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 0,
  justifyContent: 'flex-start',
  strategy: 'insert'
} satisfies DefaultSortableFlexProps;
