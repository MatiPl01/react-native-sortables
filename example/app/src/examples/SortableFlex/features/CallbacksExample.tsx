/* eslint-disable perfectionist/sort-objects */
/* eslint-disable no-console */
import { useCallback, useMemo, useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import type {
  ActiveItemDroppedCallback,
  DragEndCallback,
  DragMoveCallback,
  DragStartCallback,
  OrderChangeCallback,
  SortableFlexDragEndCallback
} from 'react-native-sortables';
import Sortable from 'react-native-sortables';

import type { SwitchOptions } from '@/components';
import {
  AnimatedText,
  Button,
  FlexCell,
  Section,
  Stagger,
  useSettingsList
} from '@/components';
import { Screen } from '@/components/layout/Screen';
import { IS_WEB } from '@/constants';
import { flex, spacing } from '@/theme';
import { formatCallbackResult, getCategories } from '@/utils';

const DATA = getCategories(IS_WEB ? 14 : 9);

function sw<T>(value1: T, value2: T): SwitchOptions<T> {
  return [
    { label: 'js', value: value1 },
    { label: 'ui', value: value2 }
  ];
}

export default function CallbacksExample() {
  const [showSettings, setShowSettings] = useState(false);
  const text = useSharedValue('Callback output will be displayed here');

  /* Callbacks executed on the JS thread */

  const onDragStartJS = useCallback<DragStartCallback>(
    params => {
      text.value = formatCallbackResult('onDragStart', params);
    },
    [text]
  );

  const onDragEndJS = useCallback<SortableFlexDragEndCallback>(
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

  const onActiveItemDroppedJS = useCallback<ActiveItemDroppedCallback>(
    params => {
      text.value = formatCallbackResult('onActiveItemDropped', params);
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

  const onActiveItemDroppedUI = useCallback<ActiveItemDroppedCallback>(
    params => {
      'worklet';
      text.value = formatCallbackResult('onActiveItemDropped', params);
    },
    [text]
  );

  const options = useMemo(
    () => ({
      onDragStart: sw(onDragStartJS, onDragStartUI),
      onDragEnd: sw(onDragEndJS, onDragEndUI),
      onOrderChange: sw(onOrderChangeJS, onOrderChangeUI),
      onDragMove: sw(onDragMoveJS, onDragMoveUI),
      onActiveItemDropped: sw(onActiveItemDroppedJS, onActiveItemDroppedUI)
    }),
    [
      onDragEndJS,
      onDragEndUI,
      onDragMoveJS,
      onDragMoveUI,
      onDragStartJS,
      onDragStartUI,
      onOrderChangeJS,
      onOrderChangeUI,
      onActiveItemDroppedJS,
      onActiveItemDroppedUI
    ]
  );

  const defaultSettings = useMemo(
    () => ({
      onDragMove: onDragMoveUI
    }),
    [onDragMoveUI]
  );

  const { values: callbacks, settingsComponent } = useSettingsList(
    options,
    defaultSettings
  );

  return (
    <Screen includeNavBarHeight>
      <Stagger wrapperStye={index => (index === 0 ? flex.fill : {})}>
        <Section title='Callback output' animateLayout fill>
          <AnimatedText style={flex.fill} text={text} multiline />
        </Section>
        <Section
          title='Settings'
          titleRight={
            <Button
              title={showSettings ? 'Hide' : 'Show'}
              variant='small'
              onPress={() => setShowSettings(prev => !prev)}
            />
          }
          animateLayout
          noOverflow>
          {showSettings && settingsComponent}
        </Section>
        <Section
          description='Drag items around to see callbacks output'
          title='Sortable.Flex'>
          <Sortable.Flex
            columnGap={spacing.sm}
            rowGap={spacing.xs}
            {...callbacks}>
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
