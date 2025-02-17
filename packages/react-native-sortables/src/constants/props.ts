import type { ViewStyle } from 'react-native';
import { LinearTransition } from 'react-native-reanimated';

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
import { IS_WEB } from './platform';

export const STYLE_PROPS = ['dropIndicatorStyle'] as const;

/**
 * DEFAULT SHARED PROPS
 */
type OptionalSharedProps =
  | 'scrollableRef'
  | keyof Omit<SortableCallbacks, 'onDragEnd'>;

type DefaultSharedProps = DefaultProps<SharedProps, OptionalSharedProps>;

export const DEFAULT_SHARED_PROPS = {
  DropIndicatorComponent: DefaultDropIndicator,
  activationAnimationDuration: 300,
  activeItemOpacity: 1,
  activeItemScale: 1.1,
  activeItemShadowOpacity: 0.2,
  animateHeight: false,
  animateWidth: false,
  autoScrollActivationOffset: 75,
  autoScrollDirection: 'vertical',
  autoScrollEnabled: true,
  autoScrollSpeed: 1,
  customHandle: false,
  debug: false,
  dragActivationDelay: 200,
  dragActivationFailOffset: 5,
  dropAnimationDuration: 300,
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
  // Layout animations on web don't work properly so we don't provide
  // default layout animations here. This is an issue that should be
  // fixed in `react-native-reanimated` in the future.
  itemEntering: IS_WEB ? null : SortableItemEntering,
  itemExiting: IS_WEB ? null : SortableItemExiting,
  itemsLayout: IS_WEB ? null : LinearTransition,
  itemsLayoutTransitionMode: 'all',
  onDragStart: undefined,
  onOrderChange: undefined,
  overDrag: 'both',
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
  | 'paddingBottom'
  | 'paddingHorizontal'
  | 'paddingLeft'
  | 'paddingRight'
  | 'paddingTop'
  | 'paddingVertical'
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
  padding: 0,
  strategy: 'insert'
} satisfies DefaultSortableFlexProps;
