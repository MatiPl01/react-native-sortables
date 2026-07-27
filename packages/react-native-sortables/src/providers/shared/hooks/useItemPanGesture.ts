import type { SharedValue } from 'react-native-reanimated';

import { useDragGesture } from '../../../integrations/gesture-handler';
import { useDragContext } from '../DragProvider';

export default function useItemPanGesture(
  key: string,
  activationAnimationProgress: SharedValue<number>
) {
  const { handleDragEnd, handleTouchesMove, handleTouchStart } =
    useDragContext();

  return useDragGesture(
    {
      // The handler reaching a terminal state is the only signal guaranteed to
      // arrive when a drag ends without the user lifting a finger (another
      // gesture winning, or the handler being cancelled). The touch callbacks
      // below still run the same cleanup so a touch released before the
      // activation delay cancels its pending activation timeout.
      onFinalize: () => {
        'worklet';
        handleDragEnd(key, activationAnimationProgress);
      },
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
        handleDragEnd(key, activationAnimationProgress);
        control.end();
      }
    },
    [
      handleDragEnd,
      handleTouchStart,
      handleTouchesMove,
      key,
      activationAnimationProgress
    ]
  );
}
