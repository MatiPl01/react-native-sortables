import { type PropsWithChildren, useCallback } from 'react';
import {
  measure,
  scrollTo,
  useAnimatedReaction,
  useDerivedValue,
  useScrollViewOffset
} from 'react-native-reanimated';

import { useMutableValue } from '../../../integrations/reanimated';
import type {
  AutoScrollContextType,
  AutoScrollSettingsInternal
} from '../../../types';
import { createProvider } from '../../utils';
import { useCommonValuesContext } from '../CommonValuesProvider';
import { ContinuousModeUpdater } from './modes';
import useDebugHelpers from './useDebugHelpers';
import {
  calculateRawProgressHorizontal,
  calculateRawProgressVertical
} from './utils';

type AutoScrollProviderProps = PropsWithChildren<
  Required<
    Omit<AutoScrollSettingsInternal, 'autoScrollMode'> & {
      autoScrollMode: AutoScrollSettingsInternal['autoScrollMode'];
    }
  >
>;

const { AutoScrollProvider, useAutoScrollContext } = createProvider(
  'AutoScroll',
  { guarded: false }
)<AutoScrollProviderProps, AutoScrollContextType>(({ children, ...props }) => {
  return {
    children: (
      <>
        {children}
        {props.autoScrollEnabled && (
          <AutoScrollUpdater
            {...(props as Required<AutoScrollSettingsInternal>)}
          />
        )}
      </>
    ),
    value: {
      // scrollOffsetDiff,
      // updateStartScrollOffset
    }
  };
});

function AutoScrollUpdater(props: AutoScrollSettingsInternal) {
  const {
    autoScrollActivationOffset,
    autoScrollDirection,
    autoScrollExtrapolation,
    scrollableRef
  } = props;

  const isVertical = autoScrollDirection === 'vertical';
  const scrollAxis = isVertical ? 'y' : 'x';
  const {
    activeItemKey,
    containerRef,
    indexToKey,
    itemPositions,
    touchPosition
  } = useCommonValuesContext();
  const currentScrollOffset = useScrollViewOffset(scrollableRef);

  const progress = useMutableValue(0);

  const activationOffset: [number, number] = Array.isArray(
    autoScrollActivationOffset
  )
    ? autoScrollActivationOffset
    : [autoScrollActivationOffset, autoScrollActivationOffset];

  let debug: ReturnType<typeof useDebugHelpers> = {};
  if (__DEV__) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    debug = useDebugHelpers(isVertical, activationOffset);
  }

  const contentBounds = useDerivedValue<[number, number] | null>(() => {
    const firstKey = indexToKey.value[0];
    const lastKey = indexToKey.value[indexToKey.value.length - 1];
    if (
      activeItemKey.value === null ||
      firstKey === undefined ||
      lastKey === undefined
    ) {
      return null;
    }

    const firstPosition = itemPositions.value[firstKey];
    const lastPosition = itemPositions.value[lastKey];
    if (!firstPosition || !lastPosition) {
      return null;
    }

    return [firstPosition[scrollAxis], lastPosition[scrollAxis]];
  });

  const calculateRawProgress = isVertical
    ? calculateRawProgressVertical
    : calculateRawProgressHorizontal;

  useAnimatedReaction(
    () => ({
      bounds: contentBounds.value,
      position: touchPosition.value?.[scrollAxis] ?? null,
      scrollOffset: currentScrollOffset.value
    }),
    ({ bounds, position, scrollOffset }) => {
      if (!bounds || position === null || scrollOffset === null) {
        debug?.hideDebugViews?.();
        return;
      }

      const contentContainerMeasurements = measure(containerRef);
      const scrollContainerMeasurements = measure(scrollableRef);
      if (!contentContainerMeasurements || !scrollContainerMeasurements) {
        debug?.hideDebugViews?.();
        return;
      }

      progress.value = calculateRawProgress(
        position,
        contentContainerMeasurements,
        scrollContainerMeasurements,
        activationOffset,
        autoScrollExtrapolation
      );

      debug?.updateDebugRects?.(
        contentContainerMeasurements,
        scrollContainerMeasurements
      );
    },
    [debug]
  );

  const handleScroll = useCallback(
    (offset: number, animated = false) => {
      'worklet';
      scrollTo(
        scrollableRef,
        isVertical ? 0 : offset,
        isVertical ? offset : 0,
        animated
      );
    },
    [isVertical, scrollableRef]
  );

  switch (props.autoScrollMode) {
    case 'continuous':
      return (
        <ContinuousModeUpdater
          {...props}
          handleScroll={handleScroll}
          progress={progress}
        />
      );
    case 'step':
      return null; // <StepModeUpdater {...props} />;
  }
}

export { AutoScrollProvider, useAutoScrollContext };
