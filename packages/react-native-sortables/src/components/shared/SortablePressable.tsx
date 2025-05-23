import type { PropsWithChildren } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { useItemContext } from '../../providers';

type SortablePressableProps = PropsWithChildren<{
  onPress?: () => void;
}>;

export default function SortablePressable({
  children,
  onPress
}: SortablePressableProps) {
  // TODO - improve
  const { gesture } = useItemContext();

  return (
    <GestureDetector
      userSelect='none'
      gesture={Gesture.Tap()
        .onEnd(() => {
          onPress?.();
        })
        .simultaneousWithExternalGesture(gesture)
        .runOnJS(true)}>
      {children}
    </GestureDetector>
  );
}
