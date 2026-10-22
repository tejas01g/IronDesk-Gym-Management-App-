import { Platform, TextStyle } from 'react-native';

export const fontFamilies = {
  heading: Platform.select({
    ios: 'System',
    android: 'sans-serif-medium',
    default: 'System',
  }),
  bodyRegular: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'System',
  }),
  bodyMedium: Platform.select({
    ios: 'System',
    android: 'sans-serif-medium',
    default: 'System',
  }),
  bodySemiBold: Platform.select({
    ios: 'System',
    android: 'sans-serif-medium',
    default: 'System',
  }),
  bodyBold: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'System',
  }),
  hero: Platform.select({
    ios: 'System',
    android: 'sans-serif-medium',
    default: 'System',
  }),
  statNumber: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'System',
  }),
  tabLabel: Platform.select({
    ios: 'System',
    android: 'sans-serif-medium',
    default: 'System',
  }),
};

export const typography: Record<string, TextStyle> = {
  hero: {
    fontFamily: fontFamilies.heading,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  statNumber: {
    fontFamily: fontFamilies.statNumber,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  h1: {
    fontFamily: fontFamilies.heading,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  h2: {
    fontFamily: fontFamilies.heading,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  h3: {
    fontFamily: fontFamilies.heading,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  h4: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
  subtitle: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500',
  },
  bodyLarge: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
  },
  bodyLargeBold: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  body: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  bodyMedium: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  bodyBold: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  caption: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  captionMedium: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  badge: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  tabLabel: {
    fontFamily: fontFamilies.tabLabel,
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '600',
  },
};

export type TypographyType = typeof typography;
