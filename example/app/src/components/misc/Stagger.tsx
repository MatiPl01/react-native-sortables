import type { PropsWithChildren, ReactNode } from 'react';
import { Children } from 'react';
import type { ViewStyle } from 'react-native';
import Animated, {
  FadeInDown,
  LinearTransition
} from 'react-native-reanimated';

type StaggerProps = PropsWithChildren<{
  interval?: number;
  delay?: number;
  ParentComponent?: React.ComponentType<{
    children: ReactNode;
    style?: ViewStyle;
  }>;
  wrapperStye?: ((index: number) => ViewStyle) | ViewStyle;
}>;

export default function Stagger({
  children,
  delay = 0,
  interval = 100,
  ParentComponent,
  wrapperStye
}: StaggerProps) {
  const childrenArray = Children.toArray(children);

  return childrenArray.map((child, index) => {
    const style =
      wrapperStye instanceof Function ? wrapperStye(index) : wrapperStye;

    const wrappedChild = (
      <Animated.View
        entering={FadeInDown.delay(delay + index * interval)}
        key={index}
        layout={LinearTransition}
        style={style}>
        {child}
      </Animated.View>
    );

    return ParentComponent ? (
      <ParentComponent key={index} style={style}>
        {wrappedChild}
      </ParentComponent>
    ) : (
      wrappedChild
    );
  });
}
