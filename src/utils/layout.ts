import type { Position } from '../types';

export const getItemZIndex = (
  isActive: boolean,
  pressProgress: number,
  position: Position,
  targetPosition?: Position
): number => {
  'worklet';
  if (isActive) {
    return 3;
  }
  if (pressProgress > 0) {
    return 2;
  }
  // If the item is being re-ordered but is not dragged
  if (
    targetPosition &&
    (position.x !== targetPosition.x || position.y !== targetPosition.y)
  ) {
    return 1;
  }
  return 0;
};
