import type {
  FlexAlignments,
  FlexLayout,
  FlexLayoutProps
} from '../../../../types';
import { calculateLayout } from './layout';

const FLEX_START_ALIGNMENTS: FlexAlignments = {
  alignContent: 'flex-start',
  alignItems: 'flex-start',
  justifyContent: 'flex-start'
};

// Builds the calculateLayout input for a vertical (column) Sortable.Flex from a
// list of item heights, mirroring what FlexLayoutProvider feeds it for a list.
const columnProps = (
  heights: Array<number>,
  maxHeight: number,
  {
    flexWrap = 'wrap',
    width = 200
  }: { flexWrap?: FlexLayoutProps['flexWrap']; width?: number } = {}
): FlexLayoutProps => {
  const indexToKey = heights.map((_, i) => `key-${i}`);
  const itemHeights = Object.fromEntries(
    indexToKey.map((key, i) => [key, heights[i]!])
  );
  const itemWidths = Object.fromEntries(indexToKey.map(key => [key, width]));

  return {
    flexAlignments: FLEX_START_ALIGNMENTS,
    flexDirection: 'column',
    flexWrap,
    gaps: { column: 0, row: 0 },
    indexToKey,
    itemHeights,
    itemWidths,
    limits: { maxHeight, maxWidth: Infinity, minHeight: 0, minWidth: 0 },
    paddings: { bottom: 0, left: 0, right: 0, top: 0 }
  };
};

const layoutOf = (props: FlexLayoutProps): FlexLayout => {
  const layout = calculateLayout(props);
  if (!layout) {
    throw new Error('expected calculateLayout to return a layout');
  }
  return layout;
};

// Regression coverage for issue #298 "Last item from a long vertical list flies
// off the screen". The fly-off was the last item being placed into a spurious
// extra column (group) instead of staying in the single vertical column.
describe('calculateLayout (Sortable.Flex column grouping)', () => {
  describe('a measured column never wraps (#298 structural guarantee)', () => {
    it('keeps every item in one group when maxHeight is unbounded', () => {
      // A column Sortable.Flex with no explicit height/maxHeight is measured,
      // so FlexLayoutProvider passes maxHeight: Infinity. However tall the list
      // gets, it must stay a single column - wrapping (and the fly-off) is then
      // structurally impossible.
      const layout = layoutOf(columnProps([100, 100, 100, 100, 100], Infinity));

      expect(layout.groupSizeLimit).toBe(Infinity);
      expect(layout.itemGroups).toEqual([
        ['key-0', 'key-1', 'key-2', 'key-3', 'key-4']
      ]);
    });
  });

  describe('sub-pixel overflow does not spill the last item (#347 tolerance)', () => {
    it('keeps items in one group when their total exceeds the limit by < 0.1px', () => {
      // Two items whose measured heights sum to 0.05px more than the column
      // height. Without the floating-point tolerance this overflow pushed the
      // last item into a new group (off-screen) - the reported "fly off".
      const layout = layoutOf(columnProps([50, 50.05], 100));

      expect(layout.itemGroups).toEqual([['key-0', 'key-1']]);
    });

    it('tolerates the classic 0.1 + 0.2 floating-point overshoot', () => {
      // 0.1 + 0.2 === 0.30000000000000004 > 0.3 in IEEE-754.
      const layout = layoutOf(columnProps([0.1, 0.2], 0.3));

      expect(layout.itemGroups).toEqual([['key-0', 'key-1']]);
    });
  });

  describe('genuine overflow still wraps (no over-correction)', () => {
    it('starts a new group once an item truly exceeds the column height', () => {
      // Three 50px items in a 100px column: two fit, the third wraps. The
      // tolerance must not be so large that legitimate wrapping is suppressed.
      const layout = layoutOf(columnProps([50, 50, 50], 100));

      expect(layout.itemGroups).toEqual([['key-0', 'key-1'], ['key-2']]);
    });
  });
});
