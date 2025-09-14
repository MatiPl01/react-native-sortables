import { Fragment, memo, useRef, useState } from 'react';
import { GestureDetector } from 'react-native-gesture-handler';
import type Animated from 'react-native-reanimated';
import {
  LayoutAnimationConfig,
  useDerivedValue
} from 'react-native-reanimated';

import type {
  AnimatedStyleProp,
  LayoutAnimation
} from '../../../integrations/reanimated';
import { useMutableValue } from '../../../integrations/reanimated';
import {
  ItemContextProvider,
  ItemOutlet,
  useCommonValuesContext,
  useItemLayout,
  useItemPanGesture,
  usePortalContext
} from '../../../providers';
import ActiveItemPortal from './ActiveItemPortal';
import ItemCell from './ItemCell';

export type DraggableViewProps = {
  itemKey: string;
  itemEntering: LayoutAnimation | null;
  itemExiting: LayoutAnimation | null;
  style?: AnimatedStyleProp;
};

function DraggableView({
  itemEntering,
  itemExiting,
  itemKey: key,
  style
}: DraggableViewProps) {
  const portalContext = usePortalContext();
  const commonValuesContext = useCommonValuesContext();
  const { activeItemKey, customHandle } = commonValuesContext;

  const cellRef = useRef<Animated.View>(null);
  const [isHidden, setIsHidden] = useState(false);
  const activationAnimationProgress = useMutableValue(0);
  const isActive = useDerivedValue(() => activeItemKey.value === key);
  const layoutStyleValue = useItemLayout(
    key,
    isActive,
    activationAnimationProgress
  );
  const gesture = useItemPanGesture(key, activationAnimationProgress);

  const renderItemCell = (hidden = false) => {
    const innerComponent = (
      <ItemCell
        activationAnimationProgress={activationAnimationProgress}
        baseStyle={style}
        entering={itemEntering ?? undefined}
        exiting={itemExiting ?? undefined}
        hidden={hidden}
        isActive={isActive}
        itemKey={key}
        layoutStyleValue={layoutStyleValue}
        ref={cellRef}>
        <LayoutAnimationConfig skipEntering={false} skipExiting={false}>
          <ItemOutlet itemKey={key} />
        </LayoutAnimationConfig>
      </ItemCell>
    );

    return (
      <ItemContextProvider
        activationAnimationProgress={activationAnimationProgress}
        gesture={gesture}
        isActive={isActive}
        itemKey={key}>
        {customHandle ? (
          innerComponent
        ) : (
          <GestureDetector gesture={gesture} userSelect='none'>
            {innerComponent}
          </GestureDetector>
        )}
      </ItemContextProvider>
    );
  };

  // NORMAL CASE (no portal)

  if (!portalContext) {
    return renderItemCell();
  }

  // PORTAL CASE

  return (
    <Fragment>
      {/* We cannot unmount this item as its gesture detector must be still
      mounted to continue handling the pan gesture */}
      {renderItemCell(isHidden)}
      <ActiveItemPortal
        activationAnimationProgress={activationAnimationProgress}
        baseStyle={style}
        commonValuesContext={commonValuesContext}
        gesture={gesture}
        isActive={isActive}
        itemKey={key}
        onTeleport={setIsHidden}
      />
    </Fragment>
  );
}

export default memo(DraggableView);
