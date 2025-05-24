import { type PropsWithChildren, useMemo } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { useItemContext } from '../../providers';

type SortableTouchableProps = PropsWithChildren<{
  onTap: () => void;
  failDistance?: number;
}>;

export default function SortableTouchable({
  children,
  failDistance = 10,
  onTap
}: SortableTouchableProps) {
  const { gesture } = useItemContext();

  const tapGesture = useMemo(
    () =>
      Gesture.Tap()
        .onEnd(onTap)
        .maxDeltaX(failDistance)
        .maxDeltaY(failDistance)
        .simultaneousWithExternalGesture(gesture)
        .runOnJS(true),
    [failDistance, gesture, onTap]
  );

  return (
    <GestureDetector gesture={tapGesture} userSelect='none'>
      <View collapsable={false}>{children}</View>
    </GestureDetector>
  );
}
