import { forwardRef } from 'react';
import type { ViewProps } from 'react-native';
import Animated from 'react-native-reanimated';

import { IS_WEB } from '../../constants';
import type { RequiredBy } from '../../types';

/**
 * We have to use a custom view if we want to properly handle view layout
 * measurements on web.
 * (onLayout is called with 0 dimensions for views which have display: none,
 * so it gets called on navigation between screens)
 */
const AnimatedViewWeb = forwardRef<
  Animated.View,
  RequiredBy<ViewProps, 'onLayout'>
>(function AnimatedViewWeb({ onLayout, ...rest }, ref) {
  return (
    <Animated.View
      {...rest}
      ref={ref}
      onLayout={e => {
        const el = (e.nativeEvent as unknown as { target: HTMLElement }).target;
        // We want to call onLayout only for displayed views to prevent
        // layout animation on navigation between screens
        // @ts-expect-error This is a correct HTML element prop on web
        if (el?.offsetParent) {
          onLayout(e);
        }
      }}
    />
  );
});

export default IS_WEB ? AnimatedViewWeb : Animated.View;
