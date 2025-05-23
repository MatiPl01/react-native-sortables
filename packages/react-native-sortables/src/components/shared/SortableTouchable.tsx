import type { PropsWithChildren } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { useItemContext } from '../../providers';

type SortableTouchableProps = PropsWithChildren<{
  onTap?: () => void;
}>;

export default function SortableTouchable({
  children,
  onTap
}: SortableTouchableProps) {
  // TODO - improve
  const { gesture } = useItemContext();

  return (
    <GestureDetector
      userSelect='none'
      gesture={Gesture.Tap()
        .onEnd(() => {
          onTap?.();
        })
        .simultaneousWithExternalGesture(gesture)
        .runOnJS(true)}>
      {children}
    </GestureDetector>
  );
}
