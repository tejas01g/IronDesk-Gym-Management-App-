import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, radius, spacing } from '../theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = radius.sm,
  style,
}) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

export const MemberCardSkeleton: React.FC = () => {
  return (
    <View style={styles.cardSkeleton}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Skeleton width={44} height={44} borderRadius={13} style={{ marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <View style={styles.rowBetween}>
            <Skeleton width={130} height={18} style={{ marginBottom: 4 }} />
            <Skeleton width={55} height={20} borderRadius={radius.pill} />
          </View>
          <Skeleton width={90} height={13} />
        </View>
      </View>
      <View style={[styles.rowBetween, { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' }]}>
        <Skeleton width={120} height={22} borderRadius={8} />
        <Skeleton width={100} height={22} borderRadius={8} />
      </View>
      <View style={[styles.rowBetween, { marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' }]}>
        <Skeleton width={110} height={14} />
        <View style={{ flexDirection: 'row', gap: 7 }}>
          <Skeleton width={32} height={32} borderRadius={16} />
          <Skeleton width={32} height={32} borderRadius={16} />
          <Skeleton width={70} height={30} borderRadius={radius.pill} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.elevated,
  },
  cardSkeleton: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.card,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopColor: colors.glassBorderLight,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
