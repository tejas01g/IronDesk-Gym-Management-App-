import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {
  Phone,
  MessageSquare,
  CreditCard,
  ChevronRight,
  Clock,
  Calendar,
} from 'lucide-react-native';
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

const getInitials = (name: string): string => {
  if (!name) return 'M';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const MemberCardComponent: React.FC<MemberCardProps> = ({
  member,
  onPress,
  onCollectFee,
}) => {
  const gym = useGymStore((s) => s.gym);

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

  const statusColor = getStatusColor();
  const countdownText = getExpiryCountdownText(member.expiryDate);
  const initials = getInitials(member.name);

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => {
        haptic.light();
        onPress();
      }}
      style={styles.card}
    >
      {/* Top Row: Avatar + Member Info + Status Badge */}
      <View style={styles.topSection}>
        {/* Left: Avatar with Status Indicator Dot */}
        <View style={styles.avatarWrapper}>
          <View
            style={[
              styles.avatarBox,
              {
                borderColor: `${statusColor}40`,
                backgroundColor: `${statusColor}10`,
              },
            ]}
          >
            <Text style={[styles.avatarText, { color: colors.text }]}>{initials}</Text>
          </View>
          <View style={[styles.statusIndicatorDot, { backgroundColor: statusColor }]} />
        </View>

        {/* Center/Info: Name and Phone */}
        <View style={styles.infoBlock}>
          <View style={styles.nameRow}>
            <Text numberOfLines={1} style={styles.memberName}>
              {member.name}
            </Text>

            {/* Status Badge */}
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: `${statusColor}18`,
                  borderColor: `${statusColor}40`,
                },
              ]}
            >
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {getStatusLabel()}
              </Text>
            </View>
          </View>

          <Text style={styles.memberPhone}>{member.phone}</Text>
        </View>
      </View>

      {/* Middle Row: Plan Chip & Expiry Countdown Tag */}
      <View style={styles.middleRow}>
        <View style={styles.planBadge}>
          <Text numberOfLines={1} style={styles.planName}>
            {member.planName}
          </Text>
          <Text style={styles.planDot}>•</Text>
          <Text style={styles.planPrice}>{formatINR(member.planPrice)}</Text>
        </View>

        <View
          style={[
            styles.countdownBadge,
            member.status === 'expired' && styles.countdownExpiredBadge,
            member.status === 'expiring' && styles.countdownExpiringBadge,
          ]}
        >
          <Clock
            size={11}
            color={
              member.status === 'expired'
                ? colors.danger
                : member.status === 'expiring'
                ? colors.secondary
                : colors.textMuted
            }
          />
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
      </View>

      {/* Bottom Row: Date & Action Buttons */}
      <View style={styles.bottomRow}>
        <View style={styles.expiryDateWrap}>
          <Calendar size={12} color={colors.textMuted} />
          <Text style={styles.expiryDateLabel}>
            Expires: <Text style={styles.expiryDate}>{formatDate(member.expiryDate)}</Text>
          </Text>
        </View>

        <View style={styles.buttonGroup}>
          {/* Quick Call */}
          <TouchableOpacity
            onPress={() => makePhoneCall(member.phone)}
            style={styles.iconCircleBtn}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            activeOpacity={0.7}
          >
            <Phone size={15} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Quick WhatsApp Reminder */}
          <TouchableOpacity
            onPress={handleWhatsAppRemind}
            style={[styles.iconCircleBtn, styles.whatsappBtn]}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            activeOpacity={0.7}
          >
            <MessageSquare size={15} color={colors.whatsapp} />
          </TouchableOpacity>

          {/* Quick Collect Fee */}
          <TouchableOpacity
            onPress={onCollectFee}
            style={styles.collectFeePill}
            activeOpacity={0.8}
          >
            <CreditCard size={13} color={colors.white} />
            <Text style={styles.collectFeeText}>COLLECT</Text>
          </TouchableOpacity>

          {/* Details Chevron */}
          <View style={styles.chevronWrap}>
            <ChevronRight size={18} color={colors.textMuted} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const MemberCard = React.memo(MemberCardComponent);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#121724',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderTopColor: 'rgba(255, 255, 255, 0.16)',
    marginBottom: spacing.md,
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fontFamilies.heading,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusIndicatorDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#121724',
  },
  infoBlock: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberName: {
    fontFamily: fontFamilies.heading,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
    flex: 1,
    marginRight: spacing.sm,
  },
  memberPhone: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 5,
  },
  statusText: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 10,
    letterSpacing: 0.4,
  },
  middleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    maxWidth: '56%',
  },
  planName: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  planDot: {
    color: colors.textMuted,
    marginHorizontal: 4,
    fontSize: 10,
  },
  planPrice: {
    fontFamily: fontFamilies.bodyBold,
    color: colors.primary,
    fontSize: 12,
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    gap: 4,
  },
  countdownExpiredBadge: {
    backgroundColor: 'rgba(255, 59, 78, 0.10)',
    borderColor: 'rgba(255, 59, 78, 0.25)',
  },
  countdownExpiringBadge: {
    backgroundColor: 'rgba(255, 160, 0, 0.10)',
    borderColor: 'rgba(255, 160, 0, 0.25)',
  },
  countdownText: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 11,
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
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  expiryDateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  expiryDateLabel: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 11,
    color: colors.textMuted,
  },
  expiryDate: {
    color: colors.textSecondary,
    fontFamily: fontFamilies.bodyMedium,
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  iconCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsappBtn: {
    backgroundColor: 'rgba(37, 211, 102, 0.12)',
    borderColor: 'rgba(37, 211, 102, 0.25)',
  },
  collectFeePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    height: 30,
    borderRadius: radius.pill,
    gap: 4,
  },
  collectFeeText: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 11,
    color: colors.white,
    letterSpacing: 0.3,
  },
  chevronWrap: {
    paddingLeft: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
