import colorJson from '../tokens/color.json' with { type: 'json' };
import spaceJson from '../tokens/space.json' with { type: 'json' };
import typographyJson from '../tokens/typography.json' with { type: 'json' };

type Leaf<T> = T extends { $value: infer V } ? V : never;
type Group<T> = { [K in keyof T as K extends `$${string}` ? never : K]: Leaf<T[K]> };

const values = <T extends Record<string, unknown>>(group: T): Group<T> =>
  Object.fromEntries(
    Object.entries(group)
      .filter(([k]) => !k.startsWith('$'))
      .map(([k, v]) => [k, (v as { $value: unknown }).$value]),
  ) as Group<T>;

/** Typed, flattened view of the DTCG JSON files (single source of truth). */
export const tokens = {
  color: {
    light: values(colorJson.color.light),
    dark: values(colorJson.color.dark),
  },
  font: {
    family: values(typographyJson.font.family),
    size: values(typographyJson.font.size),
    lineHeight: values(typographyJson.font.lineHeight),
    weight: values(typographyJson.font.weight),
    tracking: values(typographyJson.font.tracking),
  },
  space: values(spaceJson.space),
  radius: values(spaceJson.radius),
  motion: {
    duration: values(spaceJson.motion.duration),
    easing: values(spaceJson.motion.easing),
  },
  size: values(spaceJson.size),
} as const;

export type Tokens = typeof tokens;
export type ThemeName = keyof Tokens['color'];
export type ColorToken = keyof Tokens['color']['light'];
