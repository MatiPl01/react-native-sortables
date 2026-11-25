import type { SharedValue } from 'react-native-reanimated';

import { useDragGesture } from '../../../integrations/gesture-handler';
import { useCommonValuesContext } from '../CommonValuesProvider';
import { useDragContext } from '../DragProvider';

export default function useItemPanGesture(
  key: string,
  activationAnimationProgress: SharedValue<number>
) {
  const { activeItemKey } = useCommonValuesContext();
  const { handleDragEnd, handleTouchesMove, handleTouchStart } =
    useDragContext();

  return useDragGesture(
    {
      onTouchesCancelled: (_event, control) => {
        'worklet';
        handleDragEnd(key, activationAnimationProgress);
        control.fail();
      },
      onTouchesDown: (event, control) => {
        'worklet';
        handleTouchStart(
          event,
          key,
          activationAnimationProgress,
          control.activate,
          control.fail
        );
      },
      onTouchesMove: (event, control) => {
        'worklet';
        handleTouchesMove(event, control.fail);
      },
      onTouchesUp: (_event, control) => {
        'worklet';
        // handleDragEnd clears the active key, so read it before that.
        const wasPickedUp = activeItemKey.value === key;
        handleDragEnd(key, activationAnimationProgress);

        // Ending a Manual gesture marks it recognized, and on iOS a recognized
        // gesture cancels the touches already delivered to the views below it,
        // swallowing a press on any button inside the item
        // (https://github.com/MatiPl01/react-native-sortables/issues/617).
        if (wasPickedUp) {
          control.end();
        } else {
          control.fail();
        }
      }
    },
    [
      handleDragEnd,
      handleTouchStart,
      handleTouchesMove,
      key,
      activationAnimationProgress,
      activeItemKey
    ]
  );
}
