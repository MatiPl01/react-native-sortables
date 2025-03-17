import { Dimensions, StyleSheet, View } from 'react-native';
import Sortable from 'react-native-sortables';

import { ScrollScreen } from '@/components';
import { MAX_CONTENT_WIDTH } from '@/constants';

const CONTAINER_WIDTH = Math.min(
  Dimensions.get('window').width,
  MAX_CONTENT_WIDTH
);
const PADDING = 20;
const GAP = 15;
const COLUMN_WIDTH = (CONTAINER_WIDTH - 2 * PADDING - GAP) / 2;

export default function ComplexLayoutExample() {
  return (
    <ScrollScreen>
      <Sortable.Flex
        activeItemScale={1.05}
        enableActiveItemSnap={false}
        justifyContent='space-between'
        padding={PADDING}
        rowGap={GAP}
        debug>
        <SingleColumnTile />
        <SingleColumnTile />
        <TwoColumnsTile />
        <TwoColumnsTile />
      </Sortable.Flex>
    </ScrollScreen>
  );
}

function SingleColumnTile() {
  return <View style={[styles.tile, styles.singleColumnTile]} />;
}

function TwoColumnsTile() {
  return <View style={[styles.tile, styles.twoColumnsTile]} />;
}

const styles = StyleSheet.create({
  singleColumnTile: {
    width: COLUMN_WIDTH
  },
  tile: {
    alignItems: 'center',
    backgroundColor: '#36877F',
    borderRadius: 10,
    height: COLUMN_WIDTH,
    justifyContent: 'center'
  },
  twoColumnsTile: {
    height: COLUMN_WIDTH / 2,
    width: 2 * COLUMN_WIDTH + GAP
  }
});
