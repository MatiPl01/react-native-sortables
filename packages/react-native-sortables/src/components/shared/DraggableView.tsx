import { useEffect } from 'react';
import type { ViewProps } from 'react-native';
import Animated, {
  LinearTransition,
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
import type { LayoutAnimation } from '../../types';
import ItemDecoration from './ItemDecoration';
import { SortableHandleInternal } from './SortableHandle';

type DraggableViewProps = {
  itemKey: string;
  entering?: LayoutAnimation;
  exiting?: LayoutAnimation;
} & ViewProps;

export default function DraggableView({
  children,
  entering,
  exiting,
  itemKey: key,
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
      onLayout={({ nativeEvent: { layout } }) => {
        handleItemMeasurement(key, {
          height: layout.height,
          width: layout.width
        });
      }}>
      {children}
    </ItemDecoration>
  );

  return (
    <Animated.View
      {...viewProps}
      layout={IS_WEB ? undefined : LinearTransition}
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
