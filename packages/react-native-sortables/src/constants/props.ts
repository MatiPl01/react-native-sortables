import type { ViewStyle } from 'react-native';
import { Extrapolation } from 'react-native-reanimated';

import { DefaultDropIndicator } from '../components/defaults';
import type {
  DefaultSharedProps,
  DefaultSortableFlexProps,
  DefaultSortableGridProps
} from '../types';
import { defaultKeyExtractor } from '../utils/keys';
import { SortableItemEntering, SortableItemExiting } from './layoutAnimations';
import { IS_ANDROID, IS_WEB, isFabric } from './platform';

export const DEFAULT_SHARED_PROPS = {
  activationAnimationDuration: 300,
  activeItemOpacity: 1,
  activeItemScale: 1.1,
  activeItemShadowOpacity: 0.2,
  animateScrollTo: { get: () => IS_ANDROID && isFabric() },
  autoScrollActivationOffset: 75,
  autoScrollDirection: 'vertical',
  autoScrollEnabled: true,
  autoScrollExtrapolation: Extrapolation.EXTEND,
  autoScrollInterval: { get: () => (IS_ANDROID && isFabric() ? 300 : 0) },
  autoScrollMaxOverscroll: 50,
  autoScrollMaxVelocity: 1000,
  bringToFrontWhenActive: true,
  customHandle: false,
  debug: false,
  dimensionsAnimationType: 'none',
  dragActivationDelay: 200,
  dragActivationFailOffset: 5,
  dropAnimationDuration: 300,
  DropIndicatorComponent: DefaultDropIndicator,
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
  itemsLayoutTransitionMode: 'all',
  onActiveItemDropped: undefined,
  onDragMove: undefined,
  onDragStart: undefined,
  onOrderChange: undefined,
  overDrag: 'both',
  overflow: 'visible',
  reorderTriggerOrigin: 'center',
  scrollableRef: undefined,
  showDropIndicator: false,
  snapOffsetX: '50%',
  snapOffsetY: '50%',
  sortEnabled: true
} satisfies DefaultSharedProps;

export const DEFAULT_SORTABLE_GRID_PROPS = {
  autoAdjustOffsetDuringDrag: false,
  autoAdjustOffsetResetTimeout: 1000,
  autoAdjustOffsetScrollPadding: 25,
  columnGap: 0,
  columns: 1,
  keyExtractor: defaultKeyExtractor,
  rowGap: 0,
  strategy: 'insert'
} satisfies DefaultSortableGridProps;

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
