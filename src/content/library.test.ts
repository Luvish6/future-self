import { libraryCategories, searchLibrary, type LibraryImage } from './library'

const img = (category: LibraryImage['category'], title: string, tags: string[]): LibraryImage =>
  ({ file: `/library/${category}/${title}.webp`, category, title, tags, creator: 'x', license: 'CC0 1.0', source: 'StockSnap', source_url: '' })
const items = [img('love', 'Family Portrait', ['family', 'portrait', 'together']), img('peace', 'Kayak Lake', ['kayak', 'lake', 'calm']), img('love', 'Couple Love', ['couple', 'love'])]

describe('image library search', () => {
  it('filters by category and searches title/tags (prefix, all terms)', () => {
    expect(searchLibrary(items, 'love', '').length).toBe(2)
    expect(searchLibrary(items, null, 'lak').map((i) => i.title)).toEqual(['Kayak Lake'])
    expect(searchLibrary(items, null, 'family together').length).toBe(1)
    expect(searchLibrary(items, 'peace', 'family').length).toBe(0)
    expect(libraryCategories(items)).toEqual(['love', 'peace'])
  })
})
