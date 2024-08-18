import { type ComponentType, useCallback } from 'react';
import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';

import { useItemContext } from '../../providers';
import { type AnyFunction, DragActivationState, type Maybe } from '../../types';

type AnyPressHandlers = {
  onPress?: Maybe<AnyFunction>;
};

export default function createSortableTouchable<P extends AnyPressHandlers>(
  Component: ComponentType<P>
): ComponentType<P> {
  function Wrapper({ onPress, ...rest }: P) {
    const { dragActivationState, isTouched } = useItemContext();
    const isCancelled = useSharedValue(false);

    useAnimatedReaction(
      () => ({
        dragState: dragActivationState.value,
        touched: isTouched.value
      }),
      ({ dragState, touched }) => {
        // Cancels when the item starts being activated
        if (touched && dragState === DragActivationState.ACTIVATING) {
          isCancelled.value = true;
        }
        // Resets state when the item is touched again
        else if (touched && dragState === DragActivationState.TOUCHED) {
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
