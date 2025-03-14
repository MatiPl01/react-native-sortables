import { StyleSheet } from 'react-native';
import Sortable from 'react-native-sortables';

import { FlexCell, ScrollScreen, Section, Stagger } from '@/components';
import { IS_WEB } from '@/constants';
import { CustomDropIndicator } from '@/examples/custom';
import { radius, spacing } from '@/theme';
import { getCategories } from '@/utils';

const DATA = getCategories(IS_WEB ? 14 : 9);

export default function DropIndicatorExample() {
  return (
    <ScrollScreen includeNavBarHeight>
      <Stagger ParentComponent={Sortable.Layer}>
        <Section title='Without drop indicator'>
          <Sortable.Flex columnGap={spacing.sm} rowGap={spacing.xs}>
            {DATA.map(item => (
              <FlexCell key={item} size='large'>
                {item}
              </FlexCell>
            ))}
          </Sortable.Flex>
        </Section>

        <Section
          description='With custom style that changes border radius of the default drop indicator'
          title='Default drop indicator'>
          <Sortable.Flex
            columnGap={spacing.sm}
            dropIndicatorStyle={styles.dropIndicatorStyle}
            rowGap={spacing.xs}
            showDropIndicator>
            {DATA.map(item => (
              <FlexCell key={item} size='large'>
                {item}
              </FlexCell>
            ))}
          </Sortable.Flex>
        </Section>

        <Section
          description='Looks better without inactive item opacity, so inactiveItemOpacity is set to 1 in this example'
          title='Custom drop indicator'>
          <Sortable.Flex
            columnGap={spacing.sm}
            DropIndicatorComponent={CustomDropIndicator}
            dropIndicatorStyle={styles.dropIndicatorStyle}
            inactiveItemOpacity={1}
            rowGap={spacing.xs}
            showDropIndicator>
            {DATA.map(item => (
              <FlexCell key={item} size='large'>
                {item}
              </FlexCell>
            ))}
          </Sortable.Flex>
        </Section>
      </Stagger>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  dropIndicatorStyle: {
    borderRadius: radius.full
  }
});
