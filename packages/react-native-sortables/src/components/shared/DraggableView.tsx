import { memo, useEffect } from 'react';
import type { ViewProps } from 'react-native';
import Animated, {
  useDerivedValue,
  useSharedValue
} from 'react-native-reanimated';

import { IS_WEB } from '../../constants';
import {
  ItemContextProvider,
  useCommonValuesContext,
  useItemLayoutStyles,
  useMeasurementsContext
} from '../../providers';
import type { LayoutAnimation, LayoutTransition } from '../../types';
import ItemDecoration from './ItemDecoration';
import { SortableHandleInternal } from './SortableHandle';

type DraggableViewProps = {
  itemKey: string;
  entering?: LayoutAnimation;
  exiting?: LayoutAnimation;
  layout?: LayoutTransition;
} & ViewProps;

function DraggableView({
  children,
  entering,
  exiting,
  itemKey: key,
  layout,
  style,
  ...viewProps
}: DraggableViewProps) {
  const { activeItemKey, customHandle } = useCommonValuesContext();
  const { handleItemMeasurement, handleItemRemoval } = useMeasurementsContext();

  const isBeingActivated = useDerivedValue(() => activeItemKey.value === key);
  const pressProgress = useSharedValue(0);
  const layoutStyles = useItemLayoutStyles(key, pressProgress);

  useEffect(() => {
    return () => handleItemRemoval(key);
  }, [key, handleItemRemoval]);

  const innerComponent = (
    <ItemDecoration
      isBeingActivated={isBeingActivated}
      itemKey={key}
      pressProgress={pressProgress}
      // Keep onLayout the closest to the children to measure the real item size
      // (without paddings or other style changes made to the wrapper component)
      onLayout={({
        nativeEvent: {
          layout: { height, width }
        }
      }) => {
        handleItemMeasurement(key, {
          height,
          width
        });
      }}>
      {children}
    </ItemDecoration>
  );

  return (
    <Animated.View
      {...viewProps}
      layout={IS_WEB ? undefined : layout}
      style={[style, layoutStyles]}>
      <ItemContextProvider
        isBeingActivated={isBeingActivated}
        itemKey={key}
        pressProgress={pressProgress}>
        <Animated.View entering={entering} exiting={exiting}>
          {customHandle ? (
            innerComponent
          ) : (
            <SortableHandleInternal>{innerComponent}</SortableHandleInternal>
          )}
        </Animated.View>
      </ItemContextProvider>
    </Animated.View>
  );
}

export default memo(DraggableView);
