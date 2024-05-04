import {
  useAnimatedReaction,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

import { useDragContext } from '../contexts/shared/DragProvider';
import { usePositionsContext } from '../contexts/shared/PositionsProvider';

export function useItemPosition(key: string) {
  const { itemPositions } = usePositionsContext();
  const { activeItemKey, activeItemPosition } = useDragContext();

  const x = useSharedValue<null | number>(null);
  const y = useSharedValue<null | number>(null);

  useAnimatedReaction(
    () => ({
      isActive: activeItemKey.value === key,
      position: itemPositions.value[key]
    }),
    ({ isActive, position }) => {
      if (!position || isActive) {
        return;
      }
      x.value = x.value === null ? position.x : withTiming(position.x);
      y.value = y.value === null ? position.y : withTiming(position.y);
    },
    [key]
  );

  useAnimatedReaction(
    () => ({
      position: activeItemPosition.value
    }),
    ({ position }) => {
      if (activeItemKey.value === key) {
        x.value = position.x;
        y.value = position.y;
      }
    }
  );

  return { x, y };
}
