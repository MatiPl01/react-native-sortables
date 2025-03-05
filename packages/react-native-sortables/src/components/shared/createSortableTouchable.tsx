import { type ComponentType, useCallback } from 'react';
import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';

import { useItemContext } from '../../providers';
import type { AnyFunction, Maybe } from '../../types';
import { DragActivationState } from '../../types';

type AnyPressHandlers = {
  onPress?: Maybe<AnyFunction>;
};

/** Factory function that creates touchable components for use within sortable items.
 * These components properly handle press gestures while preventing conflicts with
 * drag-and-drop functionality.
 *
 * @purpose
 * Ignores press events when sortable item starts being dragged
 *
 * @example
 * ```tsx
 * const renderItem = useCallback<SortableGridRenderItem<string>>(
 *   ({ item }) => (
 *     <Sortable.Pressable
 *       onPress={() => {
 *         console.log('pressed');
 *       }}
 *     >
 *       <Text>{item}</Text>
 *     </Sortable.Pressable>
 *   ),
 *   []
 * );
 *
 * <Sortable.Grid
 *   data={items}
 *   renderItem={renderItem}
 *   // ... other props
 * />
 * ```
 *
 * @important Use these components when adding interactive elements (buttons, links, etc.)
 * inside sortable items when you notice that the press event is not working as expected.
 */
export default function createSortableTouchable<P extends AnyPressHandlers>(
  Component: ComponentType<P>
): ComponentType<P> {
  function Wrapper({ onPress, ...rest }: P) {
    const { dragActivationState } = useItemContext();
    const isCancelled = useSharedValue(false);

    useAnimatedReaction(
      () => ({
        dragState: dragActivationState.value
      }),
      ({ dragState }) => {
        // Cancels when the item is active
        if (dragState === DragActivationState.ACTIVE) {
          isCancelled.value = true;
        }
        // Resets state when the item is touched again
        else if (dragState === DragActivationState.TOUCHED) {
          isCancelled.value = false;
        }
      }
    );

    const handlePress = useCallback(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (...args: Array<any>) => {
        if (isCancelled.value) return;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        onPress?.(...args);
      },
      [isCancelled, onPress]
    );

    return <Component {...(rest as P)} onPress={handlePress} />;
  }

  return Wrapper;
}
