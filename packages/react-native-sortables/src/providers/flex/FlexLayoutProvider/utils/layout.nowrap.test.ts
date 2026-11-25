import type { FlexLayoutProps } from '../../../../types';
import { calculateLayout } from './layout';

const createProps = (props: Partial<FlexLayoutProps>): FlexLayoutProps => ({
  flexAlignments: {
    alignContent: 'flex-start',
    alignItems: 'center',
    justifyContent: 'flex-start'
  },
  flexDirection: 'row',
  flexWrap: 'nowrap',
  gaps: { column: 0, row: 0 },
  indexToKey: ['a', 'b'],
  itemHeights: { a: 40, b: 60 },
  itemWidths: 50,
  limits: { maxHeight: 200, maxWidth: Infinity, minHeight: 200, minWidth: 0 },
  paddings: { bottom: 8, left: 8, right: 8, top: 8 },
  ...props
});

// Expected positions are the ones Yoga calculates for the same styles
describe('calculateLayout with flexWrap nowrap', () => {
  it('aligns row items within the container height', () => {
    const layout = calculateLayout(createProps({}));

    expect(layout?.itemPositions).toEqual({
      a: { x: 8, y: 80 },
      b: { x: 58, y: 70 }
    });
  });

  it('aligns row items within the container minHeight', () => {
    const layout = calculateLayout(
      createProps({
        limits: {
          maxHeight: Infinity,
          maxWidth: Infinity,
          minHeight: 216,
          minWidth: 0
        }
      })
    );

    expect(layout?.itemPositions).toEqual({
      a: { x: 8, y: 88 },
      b: { x: 58, y: 78 }
    });
    expect(layout?.totalDimensions.height).toBe(216);
  });

  it('aligns column items within the container width', () => {
    const layout = calculateLayout(
      createProps({
        flexDirection: 'column',
        itemHeights: 50,
        itemWidths: { a: 80, b: 120 },
        limits: {
          maxHeight: Infinity,
          maxWidth: 300,
          minHeight: 0,
          minWidth: 300
        }
      })
    );

    expect(layout?.itemPositions).toEqual({
      a: { x: 110, y: 8 },
      b: { x: 90, y: 58 }
    });
  });

  it('ignores alignContent', () => {
    const layout = calculateLayout(
      createProps({
        flexAlignments: {
          alignContent: 'center',
          alignItems: 'flex-start',
          justifyContent: 'flex-start'
        }
      })
    );

    expect(layout?.itemPositions).toEqual({
      a: { x: 8, y: 8 },
      b: { x: 58, y: 8 }
    });
  });
});
