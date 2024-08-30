/* eslint-disable import/no-unused-modules */
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import Sortable from 'react-native-sortable';

import { Button, FlexCell, Group, Section, Stagger } from '@/components';
import { colors, flex, sizes, spacing, text } from '@/theme';
import { getCategories } from '@/utils';

const DATA = getCategories(30);

export default function DebugExample() {
  const scrollableRef = useAnimatedRef<Animated.ScrollView>();

  const [debugEnabled, setDebugEnabled] = useState(true);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

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
            <Text style={styles.title}>Above SortableFlex</Text>
          </Group>

          <Sortable.Flex
            debug={debugEnabled}
            scrollableRef={autoScrollEnabled ? scrollableRef : undefined}
            style={styles.sortableFlex}>
            {DATA.map(item => (
              <FlexCell key={item} size='large'>
                {item}
              </FlexCell>
            ))}
          </Sortable.Flex>

          <Group style={styles.boundGroup} withMargin={false} bordered center>
            <Text style={styles.title}>Below SortableFlex</Text>
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
  sortableFlex: {
    columnGap: spacing.md,
    rowGap: spacing.xs
  },
  title: {
    ...text.subHeading2,
    color: colors.foreground3
  }
});
