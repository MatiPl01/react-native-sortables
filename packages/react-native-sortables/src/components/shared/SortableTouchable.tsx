import { useMemo, type PropsWithChildren } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { useItemContext } from '../../providers';
import { View } from 'react-native';

type SortableTouchableProps = PropsWithChildren<{
  onTap: () => void;
  failDistance?: number;
}>;

export default function SortableTouchable({
  children,
  onTap,
  failDistance = 10
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
    <GestureDetector userSelect='none' gesture={tapGesture}>
      <View collapsable={false}>{children}</View>
    </GestureDetector>
  );
}
