import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, spacing, fontFamilies } from '../theme';
import { haptic } from '../utils/haptics';

interface ChipProps {
  label: string;
  count?: number;
  selected: boolean;
  onPress: () => void;
  accentColor?: string;
  style?: ViewStyle;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  count,
  selected,
  onPress,
  accentColor = colors.primary,
  style,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        haptic.light();
        onPress();
      }}
      style={[
        styles.chip,
        selected && {
          borderColor: accentColor,
          backgroundColor: `${accentColor}18`,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          selected && { color: accentColor, fontFamily: fontFamilies.bodyBold },
        ]}
      >
        {label}
      </Text>
      {typeof count === 'number' && (
        <View
          style={[
            styles.countBadge,
            selected && { backgroundColor: accentColor },
          ]}
        >
          <Text
            style={[
              styles.countText,
              selected && { color: colors.black },
            ]}
          >
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  label: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 13,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countBadge: {
    marginLeft: 6,
    backgroundColor: colors.elevated,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  countText: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 11,
    color: colors.textMuted,
  },
});
