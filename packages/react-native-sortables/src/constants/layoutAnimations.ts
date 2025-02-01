import { type LayoutAnimation, withTiming } from 'react-native-reanimated';

import { ITEM_LAYOUT_ANIMATION_DURATION } from './timings';

export const SortableItemExiting = (): LayoutAnimation => {
  'worklet';
  const animations = {
    opacity: withTiming(0, {
      duration: ITEM_LAYOUT_ANIMATION_DURATION
    }),
    transform: [
      {
        scale: withTiming(0.5, {
          duration: ITEM_LAYOUT_ANIMATION_DURATION
        })
      }
    ]
  };
  const initialValues = {
    opacity: 1,
    transform: [{ scale: 1 }]
  };
  return {
    animations,
    initialValues
  };
};

export const SortableItemEntering = (): LayoutAnimation => {
  'worklet';
  const animations = {
    opacity: withTiming(1, {
      duration: ITEM_LAYOUT_ANIMATION_DURATION
    }),
    transform: [
      {
        scale: withTiming(1, {
          duration: ITEM_LAYOUT_ANIMATION_DURATION
        })
      }
    ]
  };
  const initialValues = {
    opacity: 0,
    transform: [{ scale: 0.5 }]
  };
  return {
    animations,
    initialValues
  };
};
