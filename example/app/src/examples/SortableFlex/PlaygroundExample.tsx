import { Dimensions, StyleSheet, View } from 'react-native';
import Sortable from 'react-native-sortables';

import { colors, text } from '@/theme';

const WINDOW_WIDTH = Dimensions.get('window').width;
const PADDING = 20;
const GAP = 15;
const COLUMN_WIDTH = (WINDOW_WIDTH - 2 * PADDING - GAP) / 2;

export default function Flex() {
  return (
    <Sortable.Flex
      justifyContent='space-between'
      rowGap={GAP}
      padding={PADDING}
      debug>
      <SingleColumnTile />
      <SingleColumnTile />
      <TwoColumnsTile />
      <TwoColumnsTile />
    </Sortable.Flex>
  );
}

function SingleColumnTile() {
  return <View style={[styles.tile, styles.singleColumnTile]} />;
}

function TwoColumnsTile() {
  return <View style={[styles.tile, styles.twoColumnsTile]} />;
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    backgroundColor: '#36877F',
    borderRadius: 10,
    justifyContent: 'center',
    height: COLUMN_WIDTH
  },
  singleColumnTile: {
    width: COLUMN_WIDTH
  },
  twoColumnsTile: {
    height: COLUMN_WIDTH / 2,
    width: 2 * COLUMN_WIDTH + GAP
  },
  text: {
    ...text.label2,
    color: colors.white
  }
});
