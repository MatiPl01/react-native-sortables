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
      // The touch callbacks below repeat this cleanup because they also cover a
      // touch released before the activation delay, which never reaches a
      // terminal handler state.
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
