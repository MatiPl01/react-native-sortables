import { useCallback } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import Sortable, {
  type DragEndCallback,
  type DragMoveCallback,
  type DragStartCallback,
  type OrderChangeCallback
} from 'react-native-sortables';

import { AnimatedText, FlexCell, Section, Stagger } from '@/components';
import { Screen } from '@/components/layout/Screen';
import { IS_WEB } from '@/constants';
import { flex, spacing } from '@/theme';
import { formatCallbackParams, getCategories } from '@/utils';

const DATA = getCategories(IS_WEB ? 14 : 9);

export default function CallbacksExample() {
  const text = useSharedValue('Callback output will be displayed here');

  const onDragStart = useCallback<DragStartCallback>(
    params => {
      console.log('onDragStart', _WORKLET); // called from JS
      text.value = `onDragStart:${formatCallbackParams(params)}`;
    },
    [text]
  );

  const onDragEnd = useCallback<DragEndCallback>(
    params => {
      console.log('onDragEnd', _WORKLET); // called from JS
      text.value = `onDragEnd:${formatCallbackParams(params)}`;
    },
    [text]
  );

  const onOrderChange = useCallback<OrderChangeCallback>(
    params => {
      'worklet';
      console.log('onOrderChange', _WORKLET); // called from UI because of 'worklet' directive
      text.value = `onOrderChange:${formatCallbackParams(params)}`;
    },
    [text]
  );

  const onDragMove = useCallback<DragMoveCallback>(
    params => {
      'worklet';
      console.log('onDragMove', _WORKLET); // called from UI because of 'worklet' directive
      text.value = `onDragMove:${formatCallbackParams(params)}`;
    },
    [text]
  );

  return (
    <Screen includeNavBarHeight>
      <Stagger wrapperStye={index => (index === 0 ? flex.fill : {})}>
        <Section title='Callback output' fill>
          <AnimatedText style={flex.fill} text={text} multiline />
        </Section>
        <Section
          description='Drag items around to see callbacks output'
          title='SortableFlex'>
          <Sortable.Flex
            columnGap={spacing.sm}
            rowGap={spacing.xs}
            onDragEnd={onDragEnd}
            onDragMove={onDragMove}
            onDragStart={onDragStart}
            onOrderChange={onOrderChange}>
            {DATA.map(item => (
              <FlexCell key={item} size='large'>
                {item}
              </FlexCell>
            ))}
          </Sortable.Flex>
        </Section>
      </Stagger>
    </Screen>
  );
}
