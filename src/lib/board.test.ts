import { byPosition, move, nextPosition, nextSize } from './board'

const xs = [
  { id: 'a', position: 0, created_at: '1' },
  { id: 'b', position: 1, created_at: '2' },
  { id: 'c', position: 2, created_at: '3' },
]

describe('board ordering', () => {
  it('moves items and reports only changed positions', () => {
    expect(move(xs, 'b', -1)).toEqual([{ id: 'b', position: 0 }, { id: 'a', position: 1 }])
    expect(move(xs, 'a', -1)).toEqual([])
    expect(move(xs, 'c', 1)).toEqual([])
  })
  it('normalizes missing positions by creation order', () => {
    const loose = [{ id: 'y', created_at: '2' }, { id: 'x', created_at: '1' }]
    expect(byPosition(loose).map((x) => x.id)).toEqual(['x', 'y'])
    expect(move(loose, 'y', -1)).toEqual([{ id: 'y', position: 0 }, { id: 'x', position: 1 }])
  })
  it('appends and cycles sizes', () => {
    expect(nextPosition(xs)).toBe(3)
    expect(nextPosition([])).toBe(0)
    expect([nextSize('S'), nextSize('M'), nextSize('L'), nextSize()]).toEqual(['M', 'L', 'S', 'M'])
  })
})
