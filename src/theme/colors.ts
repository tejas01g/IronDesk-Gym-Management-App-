export const colors = {
  // Base backgrounds
  background: '#0B0B0F',
  surface: '#15151B',
  elevated: '#1D1D26',
  card: '#15151B',
  inputBackground: '#121217',

  // Borders
  border: '#262633',
  borderLight: '#323242',
  borderAccent: '#C6FF0033',

  // Primary Accent: Electric Lime
  primary: '#C6FF00',
  primaryDark: '#9ECC00',
  primarySoft: 'rgba(198, 255, 0, 0.12)',
  primaryMuted: 'rgba(198, 255, 0, 0.08)',

  // Secondary Accent: Hot Orange (Warnings / Expiring in 7 days)
  secondary: '#FF5A1F',
  secondaryDark: '#D94812',
  secondarySoft: 'rgba(255, 90, 31, 0.12)',

  // Feedback Colors
  danger: '#FF3B4E',
  dangerSoft: 'rgba(255, 59, 78, 0.12)',
  success: '#2DD881',
  successSoft: 'rgba(45, 216, 129, 0.12)',
  info: '#38BDF8',
  infoSoft: 'rgba(56, 189, 248, 0.12)',

  // Text Colors
  text: '#F5F5F7',
  textSecondary: '#C4C4D0',
  textMuted: '#8A8A9A',
  textDisabled: '#525260',
  textInverse: '#0B0B0F',

  // Status mapping
  statusActive: '#2DD881',
  statusExpiring: '#FF5A1F',
  statusExpired: '#FF3B4E',

  // Special Accents
  founderGold: '#FFD700',
  founderGoldSoft: 'rgba(255, 215, 0, 0.15)',
  whatsapp: '#25D366',
  whatsappDark: '#1EAA52',

  // Overlay / Backdrop
  backdrop: 'rgba(0, 0, 0, 0.75)',
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export type ColorsType = typeof colors;
