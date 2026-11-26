import type { FlexLayoutProps } from '../../../../types';
import { calculateLayout } from './layout';

const NO_PADDING = { bottom: 0, left: 0, right: 0, top: 0 };

const createProps = (props: Partial<FlexLayoutProps>): FlexLayoutProps => ({
  flexAlignments: {
    alignContent: 'flex-start',
    alignItems: 'flex-start',
    justifyContent: 'flex-start'
  },
  flexDirection: 'row',
  flexWrap: 'wrap',
  gaps: { column: 0, row: 0 },
  indexToKey: ['a', 'b'],
  itemHeights: 60,
  itemWidths: 60,
  limits: { maxHeight: Infinity, maxWidth: 100, minHeight: 0, minWidth: 100 },
  paddings: NO_PADDING,
  ...props
});

describe('calculateLayout', () => {
  it.each([
    {
      crossAxis: 'y',
      flexDirection: 'row-reverse',
      paddings: { ...NO_PADDING, bottom: 40, top: 10 }
    },
    {
      crossAxis: 'x',
      flexDirection: 'column-reverse',
      limits: {
        maxHeight: 100,
        maxWidth: Infinity,
        minHeight: 100,
        minWidth: 0
      },
      paddings: { ...NO_PADDING, left: 10, right: 40 }
    }
  ] as const)(
    'places $flexDirection group offsets where the items are',
    ({ crossAxis, ...props }) => {
      const layout = calculateLayout(createProps(props))!;

      expect(layout.itemPositions.a![crossAxis]).toBe(10);
      expect(layout.itemPositions.b![crossAxis]).toBe(70);
      expect(layout.crossAxisGroupOffsets).toEqual([10, 70]);
    }
  );

  it('keeps paddings in the size of an empty container with gaps', () => {
    const layout = calculateLayout(
      createProps({
        gaps: { column: 10, row: 10 },
        indexToKey: [],
        paddings: { bottom: 16, left: 16, right: 16, top: 16 }
      })
    )!;

    expect(layout.totalDimensions).toEqual({ height: 32, width: 100 });
  });

  it.each(['column', 'row'] as const)(
    'keeps main axis paddings in the size of an empty %s container',
    flexDirection => {
      const layout = calculateLayout(
        createProps({
          flexDirection,
          flexWrap: 'nowrap',
          gaps: { column: 10, row: 10 },
          indexToKey: [],
          limits: {
            maxHeight: Infinity,
            maxWidth: Infinity,
            minHeight: 0,
            minWidth: 0
          },
          paddings: { bottom: 16, left: 16, right: 16, top: 16 }
        })
      )!;

      expect(layout.totalDimensions).toEqual({ height: 32, width: 32 });
    }
  );
});
