import type { PropsWithChildren } from 'react';
import { useCallback, useMemo, useRef } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import {
  clamp,
  makeMutable,
  measure,
  useAnimatedReaction
} from 'react-native-reanimated';

import {
  clearAnimatedTimeout,
  setAnimatedTimeout,
  useMutableValue
} from '../../integrations/reanimated';
import type {
  AutoOffsetAdjustmentContextType,
  GridLayoutProps
} from '../../types';
import { calculateSnapOffset, resolveDimension } from '../../utils';
import {
  useAutoScrollContext,
  useCommonValuesContext,
  useCustomHandleContext
} from '../shared';
import { createProvider } from '../utils';
import { calculateItemCrossOffset } from './GridLayoutProvider/utils';

enum AutoOffsetAdjustmentState {
  ENABLED, // Auto adjustment is enabled but the additional cross offset is not applied yet
  DISABLED, // Auto adjustment is disabled
  APPLIED, // Additional cross offset is applied
  RESET // Additional cross offset is being reset (intermediate state after APPLIED)
}

type KeepInViewData = {
  itemCrossOffset: number;
  itemCrossSize: number;
  isVertical: boolean;
};

type StateContextType = {
  state: AutoOffsetAdjustmentState;
  resetTimeoutId: number;
  prevSortEnabled: boolean | null;
  keepInViewData: KeepInViewData | null;
};

type AutoOffsetAdjustmentProviderProps = PropsWithChildren<{
  autoAdjustOffsetResetTimeout: number;
  autoAdjustOffsetScrollPadding: [number, number] | null | number;
}>;

const { AutoOffsetAdjustmentProvider, useAutoOffsetAdjustmentContext } =
  createProvider('AutoOffsetAdjustment', {
    guarded: false
  })<AutoOffsetAdjustmentProviderProps, AutoOffsetAdjustmentContextType>(({
    autoAdjustOffsetResetTimeout,
    autoAdjustOffsetScrollPadding
  }) => {
    const {
      activeItemDimensions,
      activeItemDropped,
      activeItemKey,
      activeItemPosition,
      containerRef,
      enableActiveItemSnap,
      itemPositions,
      keyToIndex,
      prevActiveItemKey,
      snapOffsetX,
      snapOffsetY,
      sortEnabled,
      touchPosition
    } = useCommonValuesContext();
    const { activeHandleMeasurements, activeHandleOffset } =
      useCustomHandleContext() ?? {};
    const { scrollableRef, scrollBy } = useAutoScrollContext() ?? {};

    const additionalCrossOffset = useMutableValue<null | number>(null);

    const scrollPadding = useMemo<[number, number] | null>(
      () =>
        autoAdjustOffsetScrollPadding === null
          ? null
          : Array.isArray(autoAdjustOffsetScrollPadding)
            ? autoAdjustOffsetScrollPadding
            : [autoAdjustOffsetScrollPadding, autoAdjustOffsetScrollPadding],
      [autoAdjustOffsetScrollPadding]
    );

    const contextRef = useRef<null | SharedValue<StateContextType>>(null);
    contextRef.current ??= makeMutable<StateContextType>({
      keepInViewData: null,
      prevSortEnabled: sortEnabled.value,
      resetTimeoutId: 0,
      state: AutoOffsetAdjustmentState.DISABLED
    });
    const context = contextRef.current;

    const disableAutoOffsetAdjustment = useCallback(() => {
      'worklet';
      const ctx = context.value;
      if (ctx.prevSortEnabled === null) {
        return;
      }
      clearAnimatedTimeout(ctx.resetTimeoutId);
      ctx.state = AutoOffsetAdjustmentState.DISABLED;
      sortEnabled.value = ctx.prevSortEnabled;
      ctx.prevSortEnabled = null;
      additionalCrossOffset.value = null;
    }, [context, sortEnabled, additionalCrossOffset]);

    useAnimatedReaction(
      () => activeItemDropped.value,
      dropped => {
        clearAnimatedTimeout(context.value.resetTimeoutId);
        if (
          dropped &&
          context.value.state !== AutoOffsetAdjustmentState.DISABLED
        ) {
          context.value.resetTimeoutId = setAnimatedTimeout(
            disableAutoOffsetAdjustment,
            autoAdjustOffsetResetTimeout
          );
        } else {
          context.value.state = AutoOffsetAdjustmentState.ENABLED;
        }
      }
    );

    const adjustScrollToKeepItemInView = useCallback(
      (padding: [number, number]) => {
        'worklet';
        const keepInViewData = context.value.keepInViewData;
        if (!scrollBy || !scrollableRef || !keepInViewData) {
          return;
        }

        const containerMeasurements = measure(containerRef);
        const scrollableMeasurements = measure(scrollableRef);
        if (!containerMeasurements || !scrollableMeasurements) {
          return;
        }

        const { isVertical, itemCrossOffset, itemCrossSize } = keepInViewData;
        const {
          height: scrollableHeight,
          pageX: scrollableX,
          pageY: scrollableY,
          width: scrollableWidth
        } = scrollableMeasurements;
        const { pageX: containerX, pageY: containerY } = containerMeasurements;

        const scrollableCrossSize = isVertical
          ? scrollableHeight
          : scrollableWidth;
        const relativeScrollOffset = isVertical
          ? scrollableY - containerY
          : scrollableX - containerX;
        const relativeItemOffset = itemCrossOffset - relativeScrollOffset;

        const minOffset = padding[0];
        const maxOffset = scrollableCrossSize - itemCrossSize - padding[1];

        let clampedOffset = 0;
        if (minOffset > maxOffset) {
          // Center the item if padding is too large
          clampedOffset = (minOffset + maxOffset) / 2;
        } else {
          clampedOffset = clamp(relativeItemOffset, minOffset, maxOffset);
        }

        scrollBy(relativeItemOffset - clampedOffset, true);

        context.value.keepInViewData = null;
      },
      [containerRef, scrollableRef, context, scrollBy]
    );

    const adaptLayoutProps = useCallback(
      (
        props: GridLayoutProps,
        prevProps: GridLayoutProps | null
      ): GridLayoutProps => {
        'worklet';
        const itemKey = activeItemKey.value ?? prevActiveItemKey.value;

        const ctx = context.value;
        if (ctx.state === AutoOffsetAdjustmentState.DISABLED) {
          return props;
        }
        if (ctx.state === AutoOffsetAdjustmentState.RESET || itemKey === null) {
          // This auto adjustment must be delayed one frame after the scrollBy call
          if (scrollPadding) {
            setAnimatedTimeout(() =>
              adjustScrollToKeepItemInView(scrollPadding)
            );
          }
          disableAutoOffsetAdjustment();
          return props;
        }

        const {
          gaps,
          indexToKey,
          isVertical,
          itemHeights,
          itemWidths,
          numGroups
        } = props;
        const crossItemSizes = isVertical ? itemHeights : itemWidths;
        const prevCrossIteSizes = isVertical
          ? prevProps?.itemHeights
          : prevProps?.itemWidths;
        const crossOffsetsChanged =
          crossItemSizes !== prevCrossIteSizes ||
          gaps.cross !== prevProps?.gaps.cross;

        if (!crossOffsetsChanged) {
          return { ...props, startCrossOffset: additionalCrossOffset.value };
        }

        const crossCoordinate = isVertical ? 'y' : 'x';
        const autoOffsetAdjustmentCommonProps = {
          crossGap: gaps.cross,
          crossItemSizes,
          indexToKey: indexToKey,
          numGroups
        } as const;

        if (
          activeItemKey.value === null &&
          additionalCrossOffset.value !== null &&
          prevCrossIteSizes !== null
        ) {
          if (!scrollableRef) {
            disableAutoOffsetAdjustment();
            return props;
          }

          const prevActiveKey = prevActiveItemKey.value!;
          const oldCrossOffset =
            itemPositions.value[prevActiveKey]?.[crossCoordinate] ?? 0;
          const newCrossOffset = calculateItemCrossOffset({
            ...autoOffsetAdjustmentCommonProps,
            itemKey: prevActiveKey
          });

          const scrollDistance = newCrossOffset - oldCrossOffset;
          const startCrossOffset = additionalCrossOffset.value + scrollDistance;

          const itemCrossSize = resolveDimension(crossItemSizes, prevActiveKey);
          ctx.keepInViewData =
            itemCrossSize === null
              ? null
              : {
                  isVertical,
                  itemCrossOffset: newCrossOffset,
                  itemCrossSize
                };

          setAnimatedTimeout(() => scrollBy?.(scrollDistance, false));

          ctx.state = AutoOffsetAdjustmentState.RESET;

          return {
            ...props,
            gaps: prevProps?.gaps ?? gaps,
            [isVertical ? 'itemHeights' : 'itemWidths']: prevCrossIteSizes,
            requestNextLayout: true,
            shouldAnimateLayout: false,
            startCrossOffset
          };
        }

        let snapBasedOffset = 0;

        if (
          enableActiveItemSnap.value &&
          touchPosition.value &&
          activeItemPosition.value &&
          activeItemDimensions.value
        ) {
          const offset = calculateSnapOffset(
            snapOffsetX.value,
            snapOffsetY.value,
            activeHandleMeasurements?.value ?? activeItemDimensions.value,
            activeHandleOffset?.value
          );
          snapBasedOffset = isVertical
            ? touchPosition.value.y - activeItemPosition.value.y - offset.y
            : touchPosition.value.x - activeItemPosition.value.x - offset.x;
        }

        const activeItemCrossOffset = calculateItemCrossOffset({
          ...autoOffsetAdjustmentCommonProps,
          itemKey
        });

        const activeItemIndex = keyToIndex.value[itemKey];
        const itemAtActiveIndexKey = indexToKey[activeItemIndex!];
        const itemAtActiveIndexOffset =
          itemPositions.value[itemAtActiveIndexKey!]?.[crossCoordinate] ?? 0;

        const startCrossOffset = Math.max(
          0,
          itemAtActiveIndexOffset - activeItemCrossOffset + snapBasedOffset
        );

        additionalCrossOffset.value = startCrossOffset;
        ctx.prevSortEnabled ??= sortEnabled.value;
        sortEnabled.value = false;

        return {
          ...props,
          startCrossOffset
        };
      },
      [
        activeItemKey,
        activeHandleMeasurements,
        activeHandleOffset,
        activeItemDimensions,
        activeItemPosition,
        additionalCrossOffset,
        adjustScrollToKeepItemInView,
        disableAutoOffsetAdjustment,
        enableActiveItemSnap,
        itemPositions,
        keyToIndex,
        prevActiveItemKey,
        snapOffsetX,
        snapOffsetY,
        touchPosition,
        scrollPadding,
        scrollBy,
        context,
        sortEnabled,
        scrollableRef
      ]
    );

    return {
      value: {
        adaptLayoutProps,
        additionalCrossOffset
      }
    };
  });

export { AutoOffsetAdjustmentProvider, useAutoOffsetAdjustmentContext };
