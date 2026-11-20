import data from './imageLibrary.json'
import type { Category } from '../lib/types'

/** Curated CC0 images bundled with the app (see public/library/LICENSES.json). */
export interface LibraryImage {
  file: string
  category: Category
  title: string
  tags: string[]
  creator: string
  license: string
  source: string
  source_url: string
}

export const LIBRARY = data as LibraryImage[]

/** Filter by category (null = all) and free-text search over title, tags and category. */
export function searchLibrary(items: LibraryImage[], category: Category | null, q: string): LibraryImage[] {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean)
  return items.filter((i) => (!category || i.category === category) &&
    terms.every((t) => i.title.toLowerCase().includes(t) || i.category.includes(t) || i.tags.some((g) => g.startsWith(t))))
}

export const libraryCategories = (items: LibraryImage[]) => [...new Set(items.map((i) => i.category))]
