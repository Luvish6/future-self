import { BASE, WORLD_THEMES, contrast, defaultTheme, worldCss } from './worlds'

describe('world themes', () => {
  for (const t of WORLD_THEMES)
    for (const mode of ['light', 'dark'] as const) {
      const p = t[mode], b = BASE[mode]
      it(`${t.value}/${mode} meets WCAG AA for text uses`, () => {
        expect(contrast(p.accentInk, p.accent)).toBeGreaterThanOrEqual(4.5) // primary button label
        expect(contrast(p.accent, b.bg)).toBeGreaterThanOrEqual(4.5) // links / accent text
        expect(contrast(p.accent, b.surface)).toBeGreaterThanOrEqual(4.5) // accent text on cards
        expect(contrast(p.accent, p.accentSoft)).toBeGreaterThanOrEqual(4.5) // active chips / nav
      })
    }

  it('suggests palettes without forcing them', () => {
    expect(defaultTheme('love')).toBe('love')
    expect(defaultTheme('academic')).toBe('career')
    expect(defaultTheme('custom')).toBe('neutral')
  })

  it('emits scoped light and dark rules', () => {
    const css = worldCss()
    expect(css).toContain('[data-world="love"]{--accent:#b0365c')
    expect(css).toContain('.dark [data-world="finance"]')
    expect(css).not.toContain('neutral')
  })
})
