import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  GestureResponderEvent,
} from 'react-native';
import { colors, radius, shadows, spacing } from '../theme';
import { haptic } from '../utils/haptics';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
  activeBorderColor?: string;
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  elevated = false,
  activeBorderColor,
  onPress,
  disabled = false,
}) => {
  const cardStyle: ViewStyle[] = [
    styles.card,
    elevated ? styles.elevated : styles.surface,
    activeBorderColor ? { borderTopColor: activeBorderColor, borderTopWidth: 2 } : null,
    style,
  ].filter(Boolean) as ViewStyle[];

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={(e) => {
          haptic.light();
          onPress(e);
        }}
        disabled={disabled}
        style={cardStyle}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  surface: {
    backgroundColor: colors.surface,
  },
  elevated: {
    backgroundColor: colors.elevated,
    ...shadows.cardElevated,
  },
});
