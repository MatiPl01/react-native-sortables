import { type ComponentType, useCallback } from 'react';

import { useCommonValuesContext } from '../../providers';
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
    const { activationState } = useCommonValuesContext();

    const handlePress = useCallback(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (...args: Array<any>) => {
        if (activationState.value !== DragActivationState.INACTIVE) return;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        onPress?.(...args);
      },
      [activationState, onPress]
    );

    return <Component {...(rest as P)} onPress={handlePress} />;
  }

  return Wrapper;
}
