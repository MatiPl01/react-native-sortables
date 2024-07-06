import type { PropsWithChildren } from 'react';
import {
  useAnimatedReaction,
  useScrollViewOffset
} from 'react-native-reanimated';

import type { AutoScrollProps } from '../../types';
import { createGuardedContext } from '../utils';

type AutoScrollContextType = {};

type AutoScrollProviderProps = PropsWithChildren<AutoScrollProps>;

const { AutoScrollProvider, useAutoScrollContext } = createGuardedContext(
  'AutoScroll'
)<AutoScrollContextType, AutoScrollProviderProps>(({ scrollableRef }) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const scrollOffset = useScrollViewOffset(scrollableRef); // TODO - type this properly

  console.log('????')

  useAnimatedReaction(
    () => scrollOffset.value,
    () => {
      console.log('scrollOffset.value', scrollOffset.value);
    }
  );

  return {
    value: {}
  };
});

export { AutoScrollProvider, useAutoScrollContext };
