import { Platform, ViewStyle } from 'react-native';
import { colors } from './colors';

export const shadows: Record<string, ViewStyle> = {
  card: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardElevated: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.45,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  glass: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  glowPrimary: {
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  glowSecondary: {
    ...Platform.select({
      ios: {
        shadowColor: colors.secondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  glowCyan: {
    ...Platform.select({
      ios: {
        shadowColor: colors.info,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  glowSuccess: {
    ...Platform.select({
      ios: {
        shadowColor: colors.success,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  floatingBar: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.55,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
    }),
  },
};

export type ShadowsType = typeof shadows;
