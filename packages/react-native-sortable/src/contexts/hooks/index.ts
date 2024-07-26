import type { SharedValue } from 'react-native-reanimated';
import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';

import type { Dimensions, Position } from '../../types';
import {
  useAutoScrollContext,
  useDragContext,
  useMeasurementsContext,
  usePositionsContext
} from '../shared';

// type UseItemPositionOptions = {
//   ignoreActive?: boolean;
//   easing?: EasingFunction;
//   duration?: number;
// };

// export function useItemPosition(
//   key: string,
//   {
//     duration = 300,
//     easing = Easing.inOut(Easing.ease),
//     ignoreActive = false
//   }: UseItemPositionOptions = {}
// ): {
//   x: SharedValue<null | number>;
//   y: SharedValue<null | number>;
// } {
//   const { itemPositions } = usePositionsContext();
//   const { activeItemKey, activeItemPosition } = useDragContext();
//   const { dragStartScrollOffset, scrollOffset } = useAutoScrollContext() ?? {};

//   const { x: posX, y: posY } = itemPositions.get(key, true);
//   const x = useSharedValue<null | number>(null);
//   const y = useSharedValue<null | number>(null);

//   const animationConfig = useMemo(
//     () => ({
//       duration,
//       easing
//     }),
//     [duration, easing]
//   );

//   useAnimatedReaction(
//     () => ({
//       isActive: activeItemKey.value === key,
//       position: { x: posX.value, y: posY.value }
//     }),
//     ({ isActive, position }) => {
//       if (!ignoreActive && isActive) {
//         return;
//       }
//       x.value =
//         x.value === null ? position.x : withTiming(position.x, animationConfig);
//       y.value =
//         y.value === null ? position.y : withTiming(position.y, animationConfig);
//     },
//     [ignoreActive, animationConfig]
//   );

//   useAnimatedReaction(
//     () => ({
//       position: activeItemPosition.value,
//       translateY:
//         (scrollOffset?.value ?? 0) - (dragStartScrollOffset?.value ?? 0)
//     }),
//     ({ position, translateY }) => {
//       if (!ignoreActive && activeItemKey.value === key) {
//         x.value = position.x;
//         y.value = position.y + translateY;
//       }
//     },
//     [scrollOffset, dragStartScrollOffset, ignoreActive]
//   );

//   return { x, y };
// }

export function useItemDimensions(key: string): {
  width: SharedValue<number>;
  height: SharedValue<number>;
} {
  const { itemDimensions, overrideItemDimensions } = useMeasurementsContext();

  const width = useSharedValue(0);
  const height = useSharedValue(0);
  const overrideDimensions = overrideItemDimensions.get(key, true);

  useAnimatedReaction(
    () => ({
      h:
        overrideDimensions.value?.height ??
        itemDimensions.value[key]?.height ??
        0,
      w:
        overrideDimensions.value?.width ?? itemDimensions.value[key]?.width ?? 0
    }),
    ({ h, w }) => {
      width.value = w;
      height.value = h;
    }
  );

  return { height, width };
}

export function useActiveItemReaction(
  callback: (props: {
    activeKey: string;
    activeIndex: number;
    dimensions: Dimensions;
    position: Position;
    centerPosition: Position;
  }) => void,
  deps?: Array<unknown>
) {
  const { keyToIndex } = usePositionsContext();
  const { itemDimensions } = useMeasurementsContext();
  const { activeItemKey, activeItemPosition } = useDragContext();
  const { dragStartScrollOffset, scrollOffset } = useAutoScrollContext() ?? {};

  useAnimatedReaction(
    () => ({
      activeKey: activeItemKey.value,
      activePosition: activeItemPosition.value,
      scrollOffsetDiff:
        (scrollOffset?.value ?? 0) - (dragStartScrollOffset?.value ?? 0)
    }),
    ({ activeKey, activePosition, scrollOffsetDiff }) => {
      if (activeKey === null) {
        return;
      }
      const dimensions = itemDimensions.value[activeKey];
      if (!dimensions) {
        return;
      }

      const centerY =
        activePosition.y + dimensions.height / 2 + scrollOffsetDiff;
      const centerX = activePosition.x + dimensions.width / 2;
      const activeIndex = keyToIndex.current[activeKey]?.value;

      if (activeIndex === undefined) {
        return;
      }

      const centerPosition = {
        x: centerX,
        y: centerY
      };

      callback({
        activeIndex,
        activeKey,
        centerPosition,
        dimensions,
        position: activePosition
      });
    },
    deps
  );
}

export function useItemZIndex(
  key: string,
  pressProgress: SharedValue<number>
): SharedValue<number> {
  const { activeItemKey } = useDragContext();
  const { currentItemPositions, targetItemPositions } = usePositionsContext();

  const zIndex = useSharedValue(0);
  const { x: currentX, y: currentY } = currentItemPositions.get(key, true);
  const { x: targetX, y: targetY } = targetItemPositions.get(key, true);

  useAnimatedReaction(
    () => ({
      activeKey: activeItemKey.value,
      currentPosition: { x: currentX.value, y: currentY.value },
      isPressed: pressProgress.value > 0,
      targetPosition: { x: targetX.value, y: targetY.value }
    }),
    ({ activeKey, currentPosition, isPressed, targetPosition }) => {
      if (activeKey === key) {
        // is active
        zIndex.value = 3;
      } else if (isPressed) {
        // is being activated (is pressed)
        zIndex.value = 2;
      } else if (
        // is being re-ordered in reaction to active item movement
        currentPosition.x !== targetPosition.x ||
        currentPosition.y !== targetPosition.y
      ) {
        zIndex.value = 1;
      } else {
        // neither changes its position nor is active
        zIndex.value = 0;
      }
    }
  );

  return zIndex;
}
