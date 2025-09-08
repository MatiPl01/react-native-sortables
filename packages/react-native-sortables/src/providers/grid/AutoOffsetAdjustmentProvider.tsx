import type { PropsWithChildren } from 'react';
import { useCallback, useRef } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import { makeMutable, useAnimatedReaction } from 'react-native-reanimated';

import {
  clearAnimatedTimeout,
  setAnimatedTimeout,
  useMutableValue
} from '../../integrations/reanimated';
import type {
  AutoOffsetAdjustmentContextType,
  GridLayoutProps
} from '../../types';
import { calculateSnapOffset } from '../../utils';
import {
  useAutoScrollContext,
  useCommonValuesContext,
  useCustomHandleContext
} from '../shared';
import { createProvider } from '../utils';
import { calculateActiveItemCrossOffset } from './GridLayoutProvider/utils';

enum AutoOffsetAdjustmentState {
  ENABLED, // Auto adjustment is enabled but the additional cross offset is not applied yet
  DISABLED, // Auto adjustment is disabled
  APPLIED, // Additional cross offset is applied
  RESET // Additional cross offset is being reset (intermediate state after APPLIED)
}

type StateContext = {
  state: AutoOffsetAdjustmentState;
  resetTimeoutId: number;
  prevSortEnabled: boolean;
};

type AutoOffsetAdjustmentProviderProps = PropsWithChildren<{
  autoAdjustOffsetResetTimeout: number;
  autoAdjustOffsetScrollPadding: [number, number] | number;
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
    const { scrollBy } = useAutoScrollContext() ?? {};

    const additionalCrossOffset = useMutableValue<null | number>(null);

    const contextRef = useRef<null | SharedValue<StateContext>>(null);
    contextRef.current ??= makeMutable<StateContext>({
      prevSortEnabled: sortEnabled.value,
      resetTimeoutId: 0,
      state: AutoOffsetAdjustmentState.DISABLED
    });
    const context = contextRef.current;

    const disableAutoOffsetAdjustment = useCallback(() => {
      'worklet';
      clearAnimatedTimeout(context.value.resetTimeoutId);
      context.value.state = AutoOffsetAdjustmentState.DISABLED;
      sortEnabled.value = context.value.prevSortEnabled;
    }, [context, sortEnabled]);

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
          const prevActiveKey = prevActiveItemKey.value!;
          const oldCrossOffset =
            itemPositions.value[prevActiveKey]?.[crossCoordinate] ?? 0;
          const newCrossOffset = calculateActiveItemCrossOffset({
            ...autoOffsetAdjustmentCommonProps,
            activeItemKey: prevActiveKey
          });

          ctx.state = AutoOffsetAdjustmentState.RESET;

          const offsetDiff = newCrossOffset - oldCrossOffset;
          additionalCrossOffset.value = null;

          // Since the scrollBy function is executed synchronously, it would be called
          // before the new layout is actually applied (the animated style is calculated
          // in reaction to the itemPositions change, so the new layout is committed
          // in the next frame). We use this timeout to execute the scroll in the next frame.
          setAnimatedTimeout(() => scrollBy?.(offsetDiff, false));
          console.log(
            '>>>',
            oldCrossOffset,
            newCrossOffset,
            offsetDiff,
            crossItemSizes,
            prevCrossIteSizes
          );

          return {
            ...props,
            gaps: prevProps?.gaps ?? gaps,
            [isVertical ? 'itemHeights' : 'itemWidths']: prevCrossIteSizes,
            requestNextLayout: true,
            shouldAnimateLayout: false,
            startCrossOffset: offsetDiff
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

        const activeItemCrossOffset = calculateActiveItemCrossOffset({
          ...autoOffsetAdjustmentCommonProps,
          activeItemKey: itemKey
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
        ctx.prevSortEnabled = sortEnabled.value;
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
        disableAutoOffsetAdjustment,
        enableActiveItemSnap,
        itemPositions,
        keyToIndex,
        prevActiveItemKey,
        snapOffsetX,
        snapOffsetY,
        touchPosition,
        scrollBy,
        context,
        sortEnabled
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
