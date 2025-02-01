import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import Sortable from 'react-native-sortables';

import {
  Button,
  FlexCell,
  Group,
  OptionGroup,
  Screen,
  Section,
  Stagger
} from '@/components';
import { colors, flex, sizes, spacing, style, text } from '@/theme';
import { getCategories, IS_WEB } from '@/utils';

const DATA = getCategories(30);

export default function DebugExample() {
  const scrollableRef = useAnimatedRef<Animated.ScrollView>();

  const [debugEnabled, setDebugEnabled] = useState(true);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

  return (
    <Screen style={style.contentContainer}>
      <Stagger wrapperStye={index => (!IS_WEB && index === 3 ? flex.fill : {})}>
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
            // We set key here to dismiss the property change on the fly warning
            // (scrollableRef and debug properties of the sortable component
            // shouldn't be changed on the fly)
            contentContainerStyle={styles.scrollViewContent}
            key={2 * +debugEnabled + +autoScrollEnabled}
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
