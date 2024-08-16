import type { PropsWithChildren } from 'react';
import { useMemo, useRef } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const MAX_TAP_DURATION = 200;

type TouchableProps = PropsWithChildren<{
  onTap?: () => void;
}>;

export default function Touchable({ children, onTap }: TouchableProps) {
  const touchStartTimeRef = useRef(0);

  const tapGesture = useMemo(
    () =>
      Gesture.Manual()
        .onTouchesDown(() => {
          touchStartTimeRef.current = Date.now();
        })
        .onTouchesUp(() => {
          const duration = Date.now() - touchStartTimeRef.current;
          if (duration <= MAX_TAP_DURATION) {
            onTap?.();
          }
        })
        .runOnJS(true),
    [onTap]
  );
  return (
    <GestureDetector gesture={tapGesture}>
      <View collapsable={false}>{children}</View>
    </GestureDetector>
  );
}
