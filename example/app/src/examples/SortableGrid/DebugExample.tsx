/* eslint-disable import/no-unused-modules */
import { useCallback, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import type { SortableGridRenderItem } from 'react-native-sortable';
import Sortable from 'react-native-sortable';

import { Button, GridCard, Group, Section, Stagger } from '@/components';
import { colors, flex, sizes, spacing, text } from '@/theme';
import { getItems } from '@/utils';

const DATA = getItems(12);
const COLUMNS = 3;

export default function DebugExample() {
  const scrollableRef = useAnimatedRef<Animated.ScrollView>();

  const [debugEnabled, setDebugEnabled] = useState(true);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

  const renderItem = useCallback<SortableGridRenderItem<string>>(
    ({ item }) => <GridCard>{item}</GridCard>,
    []
  );

  return (
    <Stagger wrapperStye={index => (index === 3 ? flex.fill : {})}>
      <Section
        description='Press the buttons to change settings'
        title='Settings'
      />

      <Group style={styles.option} withMargin={false}>
        <Text>
          <Text style={text.label1}>Debug</Text>{' '}
          <Text style={text.subHeading3}>
            ({debugEnabled ? 'Enabled' : 'Disabled'})
          </Text>
        </Text>
        <Button
          style={styles.button}
          title={debugEnabled ? 'Disable' : 'Enable'}
          onPress={() => setDebugEnabled(prev => !prev)}
        />
      </Group>

      <Group style={styles.option} withMargin={false}>
        <Text>
          <Text style={text.label1}>Auto Scroll</Text>{' '}
          <Text style={text.subHeading3}>
            ({autoScrollEnabled ? 'Enabled' : 'Disabled'})
          </Text>
        </Text>
        <Button
          style={styles.button}
          title={autoScrollEnabled ? 'Disable' : 'Enable'}
          onPress={() => setAutoScrollEnabled(prev => !prev)}
        />
      </Group>

      <Group style={[flex.fill, styles.scrollViewGroup]}>
        <Animated.ScrollView
          contentContainerStyle={styles.scrollViewContent}
          ref={scrollableRef}
          style={flex.fill}>
          <Group style={styles.boundGroup} withMargin={false} bordered center>
            <Text style={styles.title}>Above SortableGrid</Text>
          </Group>

          <Sortable.Grid
            columnGap={spacing.sm}
            columns={COLUMNS}
            data={DATA}
            debug={debugEnabled}
            renderItem={renderItem}
            rowGap={spacing.xs}
            scrollableRef={autoScrollEnabled ? scrollableRef : undefined}
          />

          <Group style={styles.boundGroup} withMargin={false} bordered center>
            <Text style={styles.title}>Below SortableGrid</Text>
          </Group>
        </Animated.ScrollView>
      </Group>
    </Stagger>
  );
}

const styles = StyleSheet.create({
  boundGroup: {
    height: 100
  },
  button: {
    alignItems: 'center',
    width: sizes.xl
  },
  option: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: spacing.sm,
    marginTop: spacing.sm
  },
  scrollViewContent: {
    gap: spacing.sm,
    padding: spacing.sm
  },
  scrollViewGroup: {
    overflow: 'hidden',
    paddingHorizontal: spacing.none,
    paddingVertical: spacing.none
  },
  title: {
    ...text.subHeading2,
    color: colors.foreground3
  }
});
