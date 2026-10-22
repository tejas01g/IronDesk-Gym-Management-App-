export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  card: 20,
  cardLarge: 24,
  pill: 999,
  full: 9999,
} as const;

export type RadiusType = typeof radius;
