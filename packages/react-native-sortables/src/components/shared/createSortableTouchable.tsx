import { type ComponentType, useCallback } from 'react';
import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';

import { useItemContext } from '../../providers';
import type { AnyFunction, Maybe } from '../../types';
import { DragActivationState } from '../../types';

type AnyPressHandlers = {
  onPress?: Maybe<AnyFunction>;
};

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
