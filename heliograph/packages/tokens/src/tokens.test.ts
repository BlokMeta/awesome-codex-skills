import { describe, expect, it } from 'vitest';
import { AA_LARGE, AA_TEXT, contrastRatio, hexToRgb, luminance } from './contrast.js';
import { type ThemeName, tokens } from './tokens.js';

const themes: ThemeName[] = ['light', 'dark'];

describe('color tokens', () => {
  it('define the same keys in both themes (no theme-only colors, docs/07)', () => {
    expect(Object.keys(tokens.color.dark).sort()).toEqual(Object.keys(tokens.color.light).sort());
  });

  it.each(themes)('%s: text on ground/surface meets WCAG AA', (theme) => {
    const c = tokens.color[theme];
    for (const bg of [c.ground, c.surface, c.surface2]) {
      expect(contrastRatio(c.ink, bg)).toBeGreaterThanOrEqual(AA_TEXT);
      expect(contrastRatio(c.ink2, bg)).toBeGreaterThanOrEqual(AA_TEXT);
      expect(contrastRatio(c.ink3, bg)).toBeGreaterThanOrEqual(AA_LARGE);
    }
  });

  it.each(themes)('%s: accent and semantic colors read against the ground', (theme) => {
    const c = tokens.color[theme];
    for (const fg of [c.tide, c.good, c.warn, c.critical]) {
      expect(contrastRatio(fg, c.ground)).toBeGreaterThanOrEqual(AA_LARGE);
    }
    expect(contrastRatio(c.flashInk, c.flash)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrastRatio(c.ink, c.tideSoft)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('keeps greys hue-biased rather than pure (no #808080-style neutrals)', () => {
    for (const theme of themes) {
      for (const key of ['ground', 'surface2', 'ink2', 'ink3', 'line'] as const) {
        const [r, g, b] = hexToRgb(tokens.color[theme][key]);
        expect(r === g && g === b).toBe(false);
      }
    }
  });
});

describe('scales', () => {
  it('type sizes and line heights pair one-to-one and grow monotonically', () => {
    const sizes = Object.values(tokens.font.size).map((v) => Number.parseInt(v, 10));
    const heights = Object.values(tokens.font.lineHeight).map((v) => Number.parseInt(v, 10));
    expect(sizes.length).toBe(heights.length);
    for (let i = 1; i < sizes.length; i++) expect(sizes[i]).toBeGreaterThan(sizes[i - 1] as number);
    for (let i = 0; i < sizes.length; i++)
      expect(heights[i]).toBeGreaterThanOrEqual(sizes[i] as number);
  });

  it('space scale is ascending and touch target is at least 44px', () => {
    const space = Object.values(tokens.space).map((v) => Number.parseInt(v, 10));
    for (let i = 1; i < space.length; i++) expect(space[i]).toBeGreaterThan(space[i - 1] as number);
    expect(Number.parseInt(tokens.size.touchTarget, 10)).toBeGreaterThanOrEqual(44);
  });

  it('contrast helpers match known reference values', () => {
    expect(luminance('#FFFFFF')).toBeCloseTo(1, 5);
    expect(luminance('#000000')).toBe(0);
    expect(contrastRatio('#000', '#fff')).toBeCloseTo(21, 1);
  });
});
