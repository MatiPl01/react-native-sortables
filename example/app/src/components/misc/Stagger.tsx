import type { PropsWithChildren, ReactNode } from 'react';
import { Children } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';

type StaggerProps = PropsWithChildren<{
  interval?: number;
  ParentComponent?: React.ComponentType<{ children: ReactNode }>;
}>;

export default function Stagger({
  ParentComponent,
  children,
  interval = 100
}: StaggerProps) {
  const childrenArray = Children.toArray(children);

  return childrenArray.map((child, index) => {
    const wrappedChild = (
      <Animated.View entering={FadeInDown.delay(index * interval)} key={index}>
        {child}
      </Animated.View>
    );

    return ParentComponent ? (
      <ParentComponent key={index}>{wrappedChild}</ParentComponent>
    ) : (
      wrappedChild
    );
  });
}
