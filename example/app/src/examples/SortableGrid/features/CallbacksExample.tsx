/* eslint-disable perfectionist/sort-objects */
/* eslint-disable no-console */
import { useCallback, useMemo } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import Sortable, {
  type DragEndCallback,
  type DragMoveCallback,
  type DragStartCallback,
  type OrderChangeCallback,
  type SortableGridRenderItem
} from 'react-native-sortables';

import type { SwitchSettings } from '@/components';
import {
  AnimatedText,
  GridCard,
  Group,
  Screen,
  Section,
  Stagger,
  useSettingsList
} from '@/components';
import { flex, spacing } from '@/theme';
import { formatCallbackResult, getItems } from '@/utils';

const DATA = getItems(8);
const COLUMNS = 4;

function sw<T>(value1: T, value2: T): SwitchSettings<T> {
  return [
    { label: 'js', value: value1 },
    { label: 'ui', value: value2 }
  ];
}

export default function CallbacksExample() {
  const text = useSharedValue('Callback output will be displayed here');

  /* Callbacks executed on the JS thread */

  const onDragStartJS = useCallback<DragStartCallback>(
    params => {
      text.value = formatCallbackResult('onDragStart', params);
    },
    [text]
  );

  const onDragEndJS = useCallback<DragEndCallback>(
    params => {
      text.value = formatCallbackResult('onDragEnd', params);
    },
    [text]
  );

  const onOrderChangeJS = useCallback<OrderChangeCallback>(
    params => {
      text.value = formatCallbackResult('onOrderChange', params);
    },
    [text]
  );

  const onDragMoveJS = useCallback<DragMoveCallback>(
    params => {
      text.value = formatCallbackResult('onDragMove', params);
    },
    [text]
  );

  /* Callbacks executed on the UI thread */

  const onDragStartUI = useCallback<DragStartCallback>(
    params => {
      'worklet';
      text.value = formatCallbackResult('onDragStart', params);
    },
    [text]
  );

  const onDragEndUI = useCallback<DragEndCallback>(
    params => {
      'worklet';
      text.value = formatCallbackResult('onDragEnd', params);
    },
    [text]
  );

  const onOrderChangeUI = useCallback<OrderChangeCallback>(
    params => {
      'worklet';
      text.value = formatCallbackResult('onOrderChange', params);
    },
    [text]
  );

  const onDragMoveUI = useCallback<DragMoveCallback>(
    params => {
      'worklet';
      text.value = formatCallbackResult('onDragMove', params);
    },
    [text]
  );

  const renderItem = useCallback<SortableGridRenderItem<(typeof DATA)[number]>>(
    ({ item }) => <GridCard>{item}</GridCard>,
    []
  );

  const options = useMemo(
    () => ({
      onDragStart: sw(onDragStartJS, onDragStartUI),
      onDragEnd: sw(onDragEndJS, onDragEndUI),
      onOrderChange: sw(onOrderChangeJS, onOrderChangeUI),
      onDragMove: sw(onDragMoveJS, onDragMoveUI)
    }),
    [
      onDragEndJS,
      onDragEndUI,
      onDragMoveJS,
      onDragMoveUI,
      onDragStartJS,
      onDragStartUI,
      onOrderChangeJS,
      onOrderChangeUI
    ]
  );

  const { values: callbacks, settingsComponent } = useSettingsList(options);

  return (
    <Screen includeNavBarHeight>
      <Stagger wrapperStye={index => (index === 0 ? flex.fill : {})}>
        <Section title='Callback output' fill>
          <AnimatedText style={flex.fill} text={text} multiline />
        </Section>
        <Group>{settingsComponent}</Group>
        <Section
          description='Drag items around to see callbacks output'
          title='Sortable.Grid'>
          <Sortable.Grid
            columnGap={spacing.xs}
            columns={COLUMNS}
            data={DATA}
            renderItem={renderItem}
            rowGap={spacing.xs}
            {...callbacks}
          />
        </Section>
      </Stagger>
    </Screen>
  );
}
