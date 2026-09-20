export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  card: 16,
  cardLarge: 20,
  pill: 999,
  full: 9999,
} as const;

export type RadiusType = typeof radius;
