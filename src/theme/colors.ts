export const colors = {
  // Base backgrounds - deep midnight obsidian with atmospheric slate undertone
  background: '#080A10',
  surface: 'rgba(22, 28, 42, 0.65)',
  surfaceSolid: '#121722',
  elevated: 'rgba(28, 36, 54, 0.82)',
  elevatedSolid: '#182030',
  card: 'rgba(20, 26, 40, 0.65)',
  inputBackground: 'rgba(16, 21, 32, 0.75)',

  // Liquid Glass Specific Tokens
  glassBg: 'rgba(22, 28, 42, 0.65)',
  glassBorder: 'rgba(255, 255, 255, 0.09)',
  glassBorderLight: 'rgba(255, 255, 255, 0.14)',
  glassHighlight: 'rgba(255, 255, 255, 0.20)',
  glassPill: 'rgba(255, 255, 255, 0.06)',
  glassPillBorder: 'rgba(255, 255, 255, 0.10)',
  floatingDockBg: 'rgba(18, 24, 36, 0.85)',
  floatingDockBorder: 'rgba(255, 255, 255, 0.10)',
  ambientGlow: 'rgba(20, 32, 52, 0.50)',

  // Borders
  border: 'rgba(255, 255, 255, 0.09)',
  borderLight: 'rgba(255, 255, 255, 0.14)',
  borderAccent: 'rgba(255, 85, 56, 0.35)',

  // Primary Accent: Warm Vivid Coral Flame (from the image streak & workouts icon)
  primary: '#FF5538',
  primaryDark: '#E04026',
  primarySoft: 'rgba(255, 85, 56, 0.14)',
  primaryMuted: 'rgba(255, 85, 56, 0.08)',

  // Secondary Accent: Warm Amber (Hourglass duration / warnings)
  secondary: '#FFA000',
  secondaryDark: '#E68A00',
  secondarySoft: 'rgba(255, 160, 0, 0.14)',

  // Feedback Colors
  danger: '#FF3B4E',
  dangerSoft: 'rgba(255, 59, 78, 0.14)',
  success: '#22C55E',
  successSoft: 'rgba(34, 197, 94, 0.14)',
  info: '#00B2FF',
  infoSoft: 'rgba(0, 178, 255, 0.14)',

  // Text Colors
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textDisabled: '#475569',
  textInverse: '#080A10',

  // Status mapping
  statusActive: '#22C55E',
  statusExpiring: '#FFA000',
  statusExpired: '#FF3B4E',

  // Special Accents
  founderGold: '#FFD700',
  founderGoldSoft: 'rgba(255, 215, 0, 0.15)',
  whatsapp: '#25D366',
  whatsappDark: '#1EAA52',

  // Overlay / Backdrop
  backdrop: 'rgba(4, 6, 10, 0.80)',
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export type ColorsType = typeof colors;
