import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, radius, spacing, fontFamilies } from '../theme';
import { haptic } from '../utils/haptics';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
  fullWidth = true,
}) => {
  const handlePress = () => {
    if (disabled || loading) return;
    haptic.medium();
    onPress();
  };

  const getContainerStyle = (): ViewStyle => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryContainer;
      case 'outline':
        return styles.outlineContainer;
      case 'ghost':
        return styles.ghostContainer;
      case 'danger':
        return styles.dangerContainer;
      case 'primary':
      default:
        return styles.primaryContainer;
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryText;
      case 'outline':
        return styles.outlineText;
      case 'ghost':
        return styles.ghostText;
      case 'danger':
        return styles.dangerText;
      case 'primary':
      default:
        return styles.primaryText;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      disabled={disabled || loading}
      style={[
        styles.baseContainer,
        fullWidth && styles.fullWidth,
        getContainerStyle(),
        disabled && styles.disabledContainer,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.black : colors.primary}
        />
      ) : (
        <>
          {icon ? <>{icon}</> : null}
          <Text
            style={[
              styles.baseText,
              getTextStyle(),
              icon ? styles.textWithIcon : null,
              disabled && styles.disabledText,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseContainer: {
    height: 52,
    borderRadius: radius.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  fullWidth: {
    width: '100%',
  },
  primaryContainer: {
    backgroundColor: colors.primary,
  },
  secondaryContainer: {
    backgroundColor: colors.glassPill,
    borderWidth: 1,
    borderColor: colors.glassBorderLight,
  },
  outlineContainer: {
    backgroundColor: colors.glassPill,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  ghostContainer: {
    backgroundColor: colors.transparent,
  },
  dangerContainer: {
    backgroundColor: colors.danger,
  },
  disabledContainer: {
    backgroundColor: colors.elevated,
    borderColor: colors.border,
    opacity: 0.5,
  },
  baseText: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  primaryText: {
    color: colors.white,
  },
  secondaryText: {
    color: colors.text,
  },
  outlineText: {
    color: colors.primary,
  },
  ghostText: {
    color: colors.textSecondary,
  },
  dangerText: {
    color: colors.white,
  },
  disabledText: {
    color: colors.textDisabled,
  },
  textWithIcon: {
    marginLeft: spacing.sm,
  },
});
