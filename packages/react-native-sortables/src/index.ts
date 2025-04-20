/* eslint-disable import/no-unused-modules */
import { Pressable, TouchableHighlight, TouchableOpacity } from 'react-native';

import {
  createSortableTouchable,
  SortableFlex,
  SortableGrid,
  SortableHandle,
  SortableLayer
} from './components';
import { InterDragProvider, PortalProvider } from './providers';

export type { SortableHandleProps, SortableLayerProps } from './components';
export * from './constants/layoutAnimations';
export type {
  DragEndCallback,
  DragMoveCallback,
  DragStartCallback,
  DropIndicatorComponentProps,
  OrderChangeCallback,
  OrderChangeParams,
  OverDrag,
  ReorderTriggerOrigin,
  SortableFlexDragEndCallback,
  SortableFlexDragEndParams,
  SortableFlexProps,
  SortableFlexStrategyFactory,
  SortableFlexStyle,
  SortableGridDragEndCallback,
  SortableGridDragEndParams,
  SortableGridProps,
  SortableGridRenderItem,
  SortableGridStrategyFactory
} from './types';

/** Collection of sortable components and utilities for React Native */
const Sortable = {
  /** Flexible container component that allows reordering of child elements through drag and drop.
   * Uses flexbox layout for arranging items, making it ideal for dynamic layouts
   * where items need to flow naturally based on available space.
   *
   * @props
   * - children: Elements to be rendered and made sortable
   * - flexDirection: Direction of the main axis ('row' or 'column')
   * - gap/rowGap/columnGap: Spacing between items
   * - width/height: Container dimensions ('fill' to fill the available space or a number)
   * - ...other flex and layout customization props
   *
   * @example
   * ```tsx
   * <Sortable.Flex
   *   flexDirection="row"
   *   gap={10}
   *   flexWrap="wrap"
   * >
   *   <View style={styles.item}>
   *     <Text>Item 1</Text>
   *   </View>
   *   <View style={styles.item}>
   *     <Text>Item 2</Text>
   *   </View>
   * </Sortable.Flex>
   * ```
   *
   * @note Unlike Grid, Flex works directly with child components rather than
   * a data array and renderItem function.
   */
  Flex: SortableFlex,

  /** Grid component that allows items reordering through drag and drop interactions.
   * Commonly used for card layouts, and other grid-based interfaces.
   *
   * @props
   * - data: Array of items to render in the grid
   * - renderItem: Function rendering each grid item
   * - columns: Number of columns (default: 1)
   * - rows/rowHeight: Used together to create horizontal grid layout
   * - ...other layout and behavior customization props
   *
   * @example
   * ```tsx
   * const renderItem = useCallback<SortableGridRenderItem<string>>(
   *   ({ item }) => (
   *     <View style={styles.card}>
   *       <Text>{item}</Text>
   *     </View>
   *   ),
   *   []
   * );
   *
   * <Sortable.Grid
   *   columns={3}
   *   data={items}
   *   renderItem={renderItem}
   *   rowGap={10}
   *   columnGap={10}
   * />
   * ```
   */
  Grid: SortableGrid,

  /** Component used to create a custom drag handle that activates drag gesture.
   * Wrap this component around the part of your item that should trigger dragging.
   * Must be rendered within an item rendered in a sortable container.
   *
   * @important The customHandle prop must be set to true on the sortable container
   * for drag handles to work.
   *
   * @props
   * - children: Content to render within the handle (e.g. an icon)
   * - disabled: When true, prevents the handle from activating drag gesture
   *
   * @example
   * ```tsx
   * const renderItem = useCallback<SortableGridRenderItem<string>>(
   *   ({ item }) => (
   *     <View>
   *       <Text>{item}</Text>
   *       <Sortable.Handle>
   *         <FontAwesomeIcon icon={faGripVertical} />
   *       </Sortable.Handle>
   *     </View>
   *   ),
   *   []
   * );
   *
   * <Sortable.Grid
   *   customHandle // <- this is required when using a custom handle
   *   data={items}
   *   renderItem={renderItem}
   * />
   * ```
   */
  Handle: SortableHandle,

  // TODO - add docstring
  InterDragProvider,

  /** Component that manages zIndex for proper rendering of sortable components.
   * Automatically adjusts zIndex values to maintain proper visual hierarchy when items are dragged.
   *
   * @important In most cases you don't need this component as all sortable components
   * use SortableLayer internally. Use it only if dragged items appear under other
   * components on the screen.
   *
   * @note When multiple SortableLayer components are nested, zIndex information
   * is bubbled up and updated in each layer.
   *
   * @props
   * - children: Components whose zIndex will be managed (must include at least one sortable component)
   * - disabled: When true, prevents automatic zIndex management
   * - ...ViewProps: All props from React Native's View component are supported
   *
   * @example
   * ```tsx
   * <SortableLayer>
   *   <OtherComponent />
   *   <Sortable.Grid
   *     data={items}
   *     renderItem={renderItem}
   *   />
   *   <AnotherComponent />
   * </SortableLayer>
   * ```
   */
  Layer: SortableLayer,

  /** Optional provider that renders dragged items above all other components that are
   * wrapped within the PortalProvider.
   *
   * @note This component is optional. Use it when you want dragged items to appear
   * above other components on the screen, such as modals, or render dragged item
   * outside of the ScrollView bounds.
   *
   * @props
   * - children: Components over which dragged items should be rendered
   *
   * @example
   * ```tsx
   * export default function SomeComponent() {
   *   return (
   *     <Sortable.PortalProvider>
   *       <OtherComponent />
   *       <Sortable.Grid
   *         data={items}
   *         renderItem={renderItem}
   *       />
   *       <AnotherComponent />
   *     </Sortable.PortalProvider>
   *   );
   * }
   * ```
   */
  PortalProvider,

  /** Pressable component for use within sortable items.
   * Properly handles press gestures while preventing conflicts with drag-and-drop functionality.
   *
   * @example
   * ```tsx
   * const renderItem = useCallback<SortableGridRenderItem<string>>(
   *   ({ item }) => (
   *     <Sortable.Pressable
   *       onPress={() => console.log('pressed', item)}
   *     >
   *       <Text>{item}</Text>
   *     </Sortable.Pressable>
   *   ),
   *   []
   * );
   * ```
   */
  Pressable: createSortableTouchable(Pressable),

  /** TouchableHighlight component for use within sortable items.
   * Properly handles press gestures while preventing conflicts with drag-and-drop functionality.
   *
   * @example
   * ```tsx
   * const renderItem = useCallback<SortableGridRenderItem<string>>(
   *   ({ item }) => (
   *     <Sortable.TouchableHighlight
   *       onPress={() => console.log('pressed', item)}
   *     >
   *       <Text>{item}</Text>
   *     </Sortable.TouchableHighlight>
   *   ),
   *   []
   * );
   * ```
   */
  TouchableHighlight: createSortableTouchable(TouchableHighlight),
  /** TouchableOpacity component for use within sortable items.
   * Properly handles press gestures while preventing conflicts with drag-and-drop functionality.
   *
   * @example
   * ```tsx
   * const renderItem = useCallback<SortableGridRenderItem<string>>(
   *   ({ item }) => (
   *     <Sortable.TouchableOpacity
   *       onPress={() => console.log('pressed', item)}
   *     >
   *       <Text>{item}</Text>
   *     </Sortable.TouchableOpacity>
   *   ),
   *   []
   * );
   * ```
   */
  TouchableOpacity: createSortableTouchable(TouchableOpacity)
};

export default Sortable;
