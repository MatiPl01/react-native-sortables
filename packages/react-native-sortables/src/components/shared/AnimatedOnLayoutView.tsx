import type { View, ViewProps } from 'react-native';
import type { AnimatedProps } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';

import { IS_WEB } from '../../constants';
import { componentWithRef } from '../../utils/react';

/**
 * We have to use a custom view if we want to properly handle view layout
 * measurements on web.
 * (onLayout is called with 0 dimensions for views which have display: none,
 * so it gets called on navigation between screens)
 */
const AnimatedOnLayoutView = componentWithRef<
  View,
  Omit<AnimatedProps<ViewProps>, 'onLayout'> & {
    onLayout: ViewProps['onLayout'];
  }
>(function AnimatedOnLayoutView({ onLayout, ...rest }, ref) {
  return (
    <Animated.View
      {...rest}
      ref={ref}
      onLayout={e => {
        const el = (e.nativeEvent as unknown as { target: HTMLElement }).target;
        // We want to call onLayout only for displayed views to prevent
        // layout updates on navigation between screens
        if (el?.offsetParent) {
          onLayout?.(e);
        }
      }}
    />
  );
});

export default IS_WEB ? AnimatedOnLayoutView : Animated.View;
