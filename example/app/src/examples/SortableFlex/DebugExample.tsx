import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import Sortable from 'react-native-sortable';

import {
  Button,
  FlexCell,
  Group,
  OptionGroup,
  Section,
  Stagger
} from '@/components';
import { colors, flex, sizes, spacing, style, text } from '@/theme';
import { getCategories } from '@/utils';

const DATA = getCategories(30);

export default function DebugExample() {
  const scrollableRef = useAnimatedRef<Animated.ScrollView>();

  const [debugEnabled, setDebugEnabled] = useState(true);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

  return (
    <View style={[flex.fill, style.contentContainer]}>
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

        <Group style={[flex.fill, styles.scrollViewGroup]}>
          <Animated.ScrollView
            contentContainerStyle={styles.scrollViewContent}
            ref={scrollableRef}
            style={flex.fill}>
            <Group style={styles.boundGroup} withMargin={false} bordered center>
              <Text style={styles.title}>Above SortableFlex</Text>
            </Group>

            <Sortable.Flex
              columnGap={spacing.sm}
              debug={debugEnabled}
              rowGap={spacing.xs}
              scrollableRef={autoScrollEnabled ? scrollableRef : undefined}>
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
    </View>
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
