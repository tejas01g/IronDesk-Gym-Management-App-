import { colors } from './colors';
import { spacing } from './spacing';
import { typography, fontFamilies } from './typography';
import { radius } from './radius';
import { shadows } from './shadows';

export const theme = {
  colors,
  spacing,
  typography,
  fontFamilies,
  radius,
  shadows,
} as const;

export type Theme = typeof theme;

export { colors, spacing, typography, fontFamilies, radius, shadows };
export default theme;
