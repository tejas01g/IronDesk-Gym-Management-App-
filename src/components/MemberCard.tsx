import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated as RNAnimated,
} from 'react-native';
import Swipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Phone, MessageSquare, CreditCard, ChevronRight } from 'lucide-react-native';
import { colors, radius, spacing, fontFamilies } from '../theme';
import { Member } from '../types/models';
import { formatDate } from '../utils/dates';
import { getExpiryCountdownText } from '../utils/memberStatus';
import { formatINR } from '../utils/money';
import { openWhatsApp, makePhoneCall, formatWhatsAppMessage } from '../utils/whatsapp';
import { generateUpiUrl } from '../utils/upi';
import { useGymStore } from '../store/useGymStore';
import { haptic } from '../utils/haptics';

interface MemberCardProps {
  member: Member;
  onPress: () => void;
  onCollectFee: () => void;
}

export const MemberCard: React.FC<MemberCardProps> = ({
  member,
  onPress,
  onCollectFee,
}) => {
  const gym = useGymStore((s) => s.gym);
  const swipeableRef = useRef<SwipeableMethods>(null);

  const getStatusColor = () => {
    switch (member.status) {
      case 'active':
        return colors.statusActive;
      case 'expiring':
        return colors.statusExpiring;
      case 'expired':
      default:
        return colors.statusExpired;
    }
  };

  const getStatusLabel = () => {
    switch (member.status) {
      case 'active':
        return 'ACTIVE';
      case 'expiring':
        return 'EXPIRING';
      case 'expired':
      default:
        return 'EXPIRED';
    }
  };

  const handleWhatsAppRemind = async () => {
    swipeableRef.current?.close();
    haptic.medium();

    const upiLink = generateUpiUrl({
      upiId: gym?.upiId || '',
      name: gym?.gymName || 'Gym',
      amount: member.planPrice || 1000,
      note: 'Gym Renewal Fee',
    });

    const template = gym?.reminderTemplate || '';
    const message = formatWhatsAppMessage({
      template,
      name: member.name,
      gym: gym?.gymName || 'Our Gym',
      expiry: formatDate(member.expiryDate),
      amount: formatINR(member.planPrice),
      upiLink,
    });

    await openWhatsApp(member.phone, message);
  };

  const renderLeftActions = (
    _progress: any,
    dragX: any
  ) => {
    const trans = dragX?.interpolate
      ? dragX.interpolate({
          inputRange: [0, 80],
          outputRange: [-20, 0],
          extrapolate: 'clamp',
        })
      : 0;

    return (
      <TouchableOpacity
        style={styles.leftAction}
        onPress={handleWhatsAppRemind}
        activeOpacity={0.8}
      >
        <RNAnimated.View style={{ transform: [{ translateX: trans }], alignItems: 'center' }}>
          <MessageSquare size={22} color={colors.white} />
          <Text style={styles.actionText}>WHATSAPP</Text>
        </RNAnimated.View>
      </TouchableOpacity>
    );
  };

  const renderRightActions = (
    _progress: any,
    dragX: any
  ) => {
    const trans = dragX?.interpolate
      ? dragX.interpolate({
          inputRange: [-80, 0],
          outputRange: [0, 20],
          extrapolate: 'clamp',
        })
      : 0;

    return (
      <TouchableOpacity
        style={styles.rightAction}
        onPress={() => {
          swipeableRef.current?.close();
          onCollectFee();
        }}
        activeOpacity={0.8}
      >
        <RNAnimated.View style={{ transform: [{ translateX: trans }], alignItems: 'center' }}>
          <CreditCard size={22} color={colors.black} />
          <Text style={[styles.actionText, { color: colors.black }]}>COLLECT</Text>
        </RNAnimated.View>
      </TouchableOpacity>
    );
  };

  const statusColor = getStatusColor();
  const countdownText = getExpiryCountdownText(member.expiryDate);

  return (
    <Swipeable
      ref={swipeableRef}
      friction={2}
      leftThreshold={40}
      rightThreshold={40}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      containerStyle={styles.swipeContainer}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          haptic.light();
          onPress();
        }}
        style={[
          styles.card,
          { borderLeftColor: statusColor, borderLeftWidth: 4 },
        ]}
      >
        <View style={styles.topRow}>
          {/* Member Name & Phone */}
          <View style={styles.nameBlock}>
            <Text numberOfLines={1} style={styles.memberName}>
              {member.name}
            </Text>
            <Text style={styles.memberPhone}>{member.phone}</Text>
          </View>

          {/* Status Badge */}
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${statusColor}20`, borderColor: `${statusColor}60` },
            ]}
          >
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getStatusLabel()}
            </Text>
          </View>
        </View>

        {/* Plan & Expiry Details */}
        <View style={styles.middleRow}>
          <Text style={styles.planName}>
            {member.planName} • <Text style={styles.planPrice}>{formatINR(member.planPrice)}</Text>
          </Text>
          <Text
            style={[
              styles.countdownText,
              member.status === 'expired' && styles.expiredText,
              member.status === 'expiring' && styles.expiringText,
            ]}
          >
            {countdownText}
          </Text>
        </View>

        {/* Action Row */}
        <View style={styles.bottomRow}>
          <Text style={styles.expiryDateLabel}>
            Expiry: <Text style={styles.expiryDate}>{formatDate(member.expiryDate)}</Text>
          </Text>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              onPress={() => makePhoneCall(member.phone)}
              style={styles.iconCircleBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Phone size={16} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleWhatsAppRemind}
              style={[styles.iconCircleBtn, styles.whatsappBtn]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MessageSquare size={16} color={colors.whatsapp} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onCollectFee}
              style={styles.collectFeePill}
              activeOpacity={0.8}
            >
              <CreditCard size={14} color={colors.black} />
              <Text style={styles.collectFeeText}>FEE</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                haptic.light();
                onPress();
              }}
              style={styles.chevronBtn}
              hitSlop={{ top: 12, bottom: 12, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <ChevronRight size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  swipeContainer: {
    marginBottom: spacing.md,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  nameBlock: {
    flex: 1,
    marginRight: spacing.md,
  },
  memberName: {
    fontFamily: fontFamilies.heading,
    fontSize: 20,
    color: colors.text,
    letterSpacing: 0.8,
  },
  memberPhone: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.xs,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusText: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  middleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.xs,
  },
  planName: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  planPrice: {
    fontFamily: fontFamilies.bodyBold,
    color: colors.primary,
  },
  countdownText: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 12,
    color: colors.textMuted,
  },
  expiredText: {
    color: colors.danger,
  },
  expiringText: {
    color: colors.secondary,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  expiryDateLabel: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 12,
    color: colors.textMuted,
  },
  expiryDate: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.bodyMedium,
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  whatsappBtn: {
    borderColor: `${colors.whatsapp}50`,
  },
  collectFeePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    height: 28,
    borderRadius: radius.pill,
    marginLeft: spacing.sm,
  },
  collectFeeText: {
    fontFamily: fontFamilies.heading,
    fontSize: 11,
    color: colors.black,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  leftAction: {
    backgroundColor: colors.whatsapp,
    justifyContent: 'center',
    alignItems: 'center',
    width: 88,
    borderRadius: radius.card,
    marginBottom: spacing.md,
  },
  rightAction: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    width: 88,
    borderRadius: radius.card,
    marginBottom: spacing.md,
  },
  actionText: {
    fontFamily: fontFamilies.heading,
    fontSize: 12,
    color: colors.white,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  chevronBtn: {
    paddingLeft: spacing.sm,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
