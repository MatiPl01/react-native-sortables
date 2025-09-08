import { useCallback, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import type { SortableGridRenderItem } from 'react-native-sortables';
import Sortable from 'react-native-sortables';

import {
  Button,
  GridCard,
  Group,
  OptionGroup,
  Screen,
  Section,
  Stagger
} from '@/components';
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
    <Screen includeNavBarHeight>
      <Stagger wrapperStye={index => (index === 3 ? flex.fill : {})}>
        <Section
          description='Press the buttons to change settings'
          title='Settings'
        />

        <OptionGroup
          label='Debug'
          value={debugEnabled ? 'Enabled' : 'Disabled'}>
          <Button
            style={styles.button}
            title={debugEnabled ? 'Disable' : 'Enable'}
            onPress={() => setDebugEnabled(prev => !prev)}
          />
        </OptionGroup>

        <OptionGroup
          label='Auto Scroll'
          value={autoScrollEnabled ? 'Enabled' : 'Disabled'}>
          <Button
            style={styles.button}
            title={autoScrollEnabled ? 'Disable' : 'Enable'}
            onPress={() => setAutoScrollEnabled(prev => !prev)}
          />
        </OptionGroup>

        <Group padding='none' style={[flex.fill, styles.scrollViewGroup]}>
          <Animated.ScrollView
            // We set key here to dismiss the property change on the fly warning
            // (scrollableRef and debug properties of the sortable component
            // shouldn't be changed on the fly)
            contentContainerStyle={styles.scrollViewContent}
            key={+debugEnabled}
            ref={scrollableRef}
            style={flex.fill}>
            <Group style={styles.boundGroup} withMargin={false} bordered center>
              <Text style={styles.title}>Above Sortable.Grid</Text>
            </Group>

            <Sortable.Grid
              autoScrollEnabled={autoScrollEnabled}
              autoScrollMaxOverscroll={125}
              columnGap={spacing.sm}
              columns={COLUMNS}
              data={DATA}
              debug={debugEnabled}
              renderItem={renderItem}
              rowGap={spacing.xs}
              scrollableRef={scrollableRef}
            />

            <Group style={styles.boundGroup} withMargin={false} bordered center>
              <Text style={styles.title}>Below Sortable.Grid</Text>
            </Group>
          </Animated.ScrollView>
        </Group>
      </Stagger>
    </Screen>
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
