import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors, radius, spacing, fontFamilies } from '../theme';
import { haptic } from '../utils/haptics';

interface StatCardProps {
  label: string;
  value: number;
  formattedValue?: string;
  icon: any;
  accentColor?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  formattedValue,
  icon: IconComponent,
  accentColor = colors.primary,
  onPress,
  style,
}) => {
  const scale = useSharedValue(1);
  const [displayNumber, setDisplayNumber] = useState(0);

  // Quick count-up effect on mount
  useEffect(() => {
    let start = 0;
    const duration = 600;
    const steps = 15;
    const increment = value / steps;
    const stepTime = duration / steps;

    if (value === 0) {
      setDisplayNumber(0);
      return;
    }

    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplayNumber(value);
        clearInterval(timer);
      } else {
        setDisplayNumber(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const displayText = formattedValue
    ? formattedValue
    : displayNumber.toLocaleString('en-IN');

  return (
    <Animated.View style={[styles.wrapper, animatedStyle, style]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => {
          if (onPress) {
            haptic.light();
            onPress();
          }
        }}
        disabled={!onPress}
        style={[
          styles.card,
          {
            borderTopColor: accentColor,
            borderTopWidth: 2,
            backgroundColor: colors.surface,
          },
        ]}
      >
        <View style={styles.topRow}>
          <Text numberOfLines={1} style={styles.label}>
            {label}
          </Text>
          <View style={[styles.iconBadge, { backgroundColor: `${accentColor}18` }]}>
            <IconComponent size={16} color={accentColor} />
          </View>
        </View>

        <Text numberOfLines={1} style={[styles.valueText, { color: colors.text }]}>
          {displayText}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    minWidth: '47%',
    marginBottom: spacing.md,
  },
  card: {
    borderRadius: radius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 104,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  label: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    flex: 1,
    marginRight: 4,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    fontFamily: fontFamilies.statNumber,
    fontSize: 28,
    letterSpacing: 0.5,
  },
});
