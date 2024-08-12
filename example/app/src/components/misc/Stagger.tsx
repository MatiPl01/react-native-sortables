import { Children, type PropsWithChildren } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';

type StaggerProps = PropsWithChildren<{
  interval?: number;
}>;

export default function Stagger({ children, interval = 100 }: StaggerProps) {
  const childrenArray = Children.toArray(children);

  return childrenArray.map((child, index) => (
    <Animated.View entering={FadeInDown.delay(index * interval)} key={index}>
      {child}
    </Animated.View>
  ));
}
