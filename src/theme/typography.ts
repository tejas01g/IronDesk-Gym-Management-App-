import { Platform, TextStyle } from 'react-native';

export const fontFamilies = {
  heading: Platform.select({
    ios: 'BebasNeue',
    android: 'BebasNeue-Regular',
    default: 'sans-serif-condensed',
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
    ios: 'BebasNeue',
    android: 'BebasNeue-Regular',
    default: 'sans-serif-condensed',
  }),
  statNumber: Platform.select({
    ios: 'BebasNeue',
    android: 'BebasNeue-Regular',
    default: 'sans-serif-condensed',
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
    fontSize: 48,
    lineHeight: 52,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  statNumber: {
    fontFamily: fontFamilies.heading,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: 1,
  },
  h1: {
    fontFamily: fontFamilies.heading,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  h2: {
    fontFamily: fontFamilies.heading,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  h3: {
    fontFamily: fontFamilies.heading,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  h4: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 16,
    lineHeight: 22,
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
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tabLabel: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '600',
  },
};

export type TypographyType = typeof typography;
