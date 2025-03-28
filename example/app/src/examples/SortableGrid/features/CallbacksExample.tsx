import { useCallback } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import Sortable, {
  type DragEndCallback,
  type DragMoveCallback,
  type DragStartCallback,
  type OrderChangeCallback,
  type SortableGridRenderItem
} from 'react-native-sortables';

import { AnimatedText, GridCard, Screen, Section, Stagger } from '@/components';
import { flex, spacing } from '@/theme';
import { formatCallbackParams, getItems } from '@/utils';

const DATA = getItems(8);
const COLUMNS = 4;

export default function CallbacksExample() {
  const text = useSharedValue('Callback output will be displayed here');

  const onDragStart = useCallback<DragStartCallback>(
    params => {
      'worklet';
      console.log(_WORKLET);
      text.value = `onDragStart:${formatCallbackParams(params)}`;
    },
    [text]
  );

  const onDragEnd = useCallback<DragEndCallback>(
    params => {
      console.log(_WORKLET);
      text.value = `onDragEnd:${formatCallbackParams(params)}`;
    },
    [text]
  );

  const onOrderChange = useCallback<OrderChangeCallback>(
    params => {
      'worklet';
      console.log(_WORKLET);
      text.value = `onOrderChange:${formatCallbackParams(params)}`;
    },
    [text]
  );

  const onDragMove = useCallback<DragMoveCallback>(
    params => {
      'worklet';
      console.log(_WORKLET);
      text.value = `onDragMove:${formatCallbackParams(params)}`;
    },
    [text]
  );

  const renderItem = useCallback<SortableGridRenderItem<(typeof DATA)[number]>>(
    ({ item }) => <GridCard>{item}</GridCard>,
    []
  );

  return (
    <Screen includeNavBarHeight>
      <Stagger wrapperStye={index => (index === 0 ? flex.fill : {})}>
        <Section title='Callback output' fill>
          <AnimatedText style={flex.fill} text={text} multiline />
        </Section>
        <Section
          description='Drag items around to see callbacks output'
          title='SortableGrid'>
          <Sortable.Grid
            columnGap={spacing.xs}
            columns={COLUMNS}
            data={DATA}
            renderItem={renderItem}
            rowGap={spacing.xs}
            onDragEnd={onDragEnd}
            onDragMove={onDragMove}
            onDragStart={onDragStart}
            onOrderChange={onOrderChange}
          />
        </Section>
      </Stagger>
    </Screen>
  );
}
