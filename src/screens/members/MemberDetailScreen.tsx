import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  CreditCard,
  Calendar,
  Edit3,
  Clock,
  CheckCircle2,
  FileText,
} from 'lucide-react-native';
import { colors, fontFamilies, radius, spacing } from '../../theme';
import { RootStackParamList } from '../../app/navigation/types';
import { Member, Payment } from '../../types/models';
import { getMemberById } from '../../services/members';
import { getMemberPaymentHistory } from '../../services/payments';
import { formatDate, formatDateTime, getMonthKey, getTodayDateKey } from '../../utils/dates';
import { getExpiryCountdownText } from '../../utils/memberStatus';
import { formatINR } from '../../utils/money';
import { openWhatsApp, makePhoneCall, formatWhatsAppMessage } from '../../utils/whatsapp';
import { generateUpiUrl } from '../../utils/upi';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { useGymStore } from '../../store/useGymStore';
import { haptic } from '../../utils/haptics';

type MemberDetailNavProp = NativeStackNavigationProp<RootStackParamList, 'MemberDetail'>;
type MemberDetailRouteProp = RouteProp<RootStackParamList, 'MemberDetail'>;

export const MemberDetailScreen: React.FC = () => {
  const navigation = useNavigation<MemberDetailNavProp>();
  const route = useRoute<MemberDetailRouteProp>();
  const memberId = route.params.memberId;
  const gym = useGymStore((s) => s.gym);

  const [member, setMember] = useState<Member | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!gym?.ownerUid || !memberId) return;
    try {
      const [m, p] = await Promise.all([
        getMemberById(gym.ownerUid, memberId),
        getMemberPaymentHistory(gym.ownerUid, memberId),
      ]);
      setMember(m);
      setPayments(p);
    } catch (e) {
      console.warn('[MemberDetailScreen] Error loading member:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [gym?.ownerUid, memberId]);

  if (loading || !member) {
    return (
      <View style={[styles.container, styles.center]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <Text style={styles.loadingText}>LOADING DETAILS...</Text>
      </View>
    );
  }

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

  const handleWhatsApp = async () => {
    haptic.medium();
    const upiLink = generateUpiUrl({
      upiId: gym?.upiId || '',
      name: gym?.gymName || 'Gym',
      amount: member.planPrice || 1000,
      note: 'Gym Membership Renewal',
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

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>MEMBER PROFILE</Text>

        <TouchableOpacity
          onPress={() => navigation.navigate('AddMember', { memberId: member.id })}
          style={styles.editButton}
        >
          <Edit3 size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileTopRow}>
            <View>
              <Text style={styles.memberName}>{member.name}</Text>
              <Text style={styles.memberPhone}>{member.phone}</Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                { backgroundColor: `${statusColor}20`, borderColor: statusColor },
              ]}
            >
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {member.status.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Quick Contact Buttons */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              onPress={() => makePhoneCall(member.phone)}
              style={styles.contactBtn}
              activeOpacity={0.8}
            >
              <Phone size={18} color={colors.text} />
              <Text style={styles.contactBtnText}>CALL</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleWhatsApp}
              style={[styles.contactBtn, styles.whatsappContactBtn]}
              activeOpacity={0.8}
            >
              <MessageSquare size={18} color={colors.whatsapp} />
              <Text style={[styles.contactBtnText, { color: colors.whatsapp }]}>
                WHATSAPP
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Current Plan & Expiry Card */}
        <Card style={styles.planCard} activeBorderColor={statusColor}>
          <View style={styles.planTitleRow}>
            <View>
              <Text style={styles.planLabel}>CURRENT PLAN</Text>
              <Text style={styles.planHeading}>{member.planName}</Text>
            </View>
            <Text style={styles.planAmount}>{formatINR(member.planPrice)}</Text>
          </View>

          <View style={styles.dateInfoBox}>
            <View style={styles.dateBlock}>
              <Text style={styles.dateSub}>Start Date</Text>
              <Text style={styles.dateValue}>{formatDate(member.startDate)}</Text>
            </View>
            <View style={styles.dateBlock}>
              <Text style={styles.dateSub}>Expiry Date</Text>
              <Text style={[styles.dateValue, { color: statusColor }]}>
                {formatDate(member.expiryDate)}
              </Text>
            </View>
          </View>

          <View style={styles.countdownRow}>
            <Clock size={16} color={statusColor} />
            <Text style={[styles.countdownText, { color: statusColor }]}>
              {countdownText}
            </Text>
          </View>

          <Button
            title="COLLECT FEE / RENEW PLAN"
            onPress={() =>
              navigation.navigate('CollectFee', {
                memberId: member.id,
                member,
              })
            }
            variant="primary"
            icon={<CreditCard size={18} color={colors.black} />}
            style={styles.renewButton}
          />
        </Card>

        {/* Payment History */}
        <Card style={styles.cardSection}>
          <Text style={styles.sectionTitle}>PAYMENT HISTORY</Text>
          {payments.length === 0 ? (
            <Text style={styles.emptyHistoryText}>No past payments recorded.</Text>
          ) : (
            payments.map((p) => (
              <View key={p.id} style={styles.paymentRow}>
                <View>
                  <Text style={styles.paymentAmount}>{formatINR(p.amount)}</Text>
                  <Text style={styles.paymentDate}>{formatDateTime(p.paidAt)}</Text>
                </View>
                <View style={styles.paymentRight}>
                  <View style={styles.modeBadge}>
                    <Text style={styles.modeText}>{p.mode.toUpperCase()}</Text>
                  </View>
                  <CheckCircle2 size={16} color={colors.success} style={{ marginLeft: 6 }} />
                </View>
              </View>
            ))
          )}
        </Card>

        {/* Notes */}
        {Boolean(member.notes) && (
          <Card style={styles.cardSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>MEMBER NOTES</Text>
              <FileText size={16} color={colors.textMuted} />
            </View>
            <Text style={styles.notesBody}>{member.notes}</Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: fontFamilies.heading,
    fontSize: 18,
    color: colors.primary,
    letterSpacing: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: fontFamilies.heading,
    fontSize: 22,
    color: colors.text,
    letterSpacing: 1,
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.massive,
  },
  profileCard: {
    marginBottom: spacing.lg,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  memberName: {
    fontFamily: fontFamilies.heading,
    fontSize: 26,
    color: colors.text,
    letterSpacing: 1,
  },
  memberPhone: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.xs,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contactBtn: {
    flex: 1,
    height: 44,
    backgroundColor: colors.inputBackground,
    borderRadius: radius.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  whatsappContactBtn: {
    borderColor: `${colors.whatsapp}40`,
  },
  contactBtnText: {
    fontFamily: fontFamilies.heading,
    fontSize: 14,
    color: colors.text,
    marginLeft: spacing.xs,
    letterSpacing: 0.8,
  },
  planCard: {
    marginBottom: spacing.lg,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planLabel: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  planHeading: {
    fontFamily: fontFamilies.heading,
    fontSize: 22,
    color: colors.text,
    letterSpacing: 0.8,
  },
  planAmount: {
    fontFamily: fontFamilies.heading,
    fontSize: 26,
    color: colors.primary,
  },
  dateInfoBox: {
    flexDirection: 'row',
    backgroundColor: colors.inputBackground,
    padding: spacing.md,
    borderRadius: radius.card,
    marginVertical: spacing.md,
  },
  dateBlock: {
    flex: 1,
  },
  dateSub: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 12,
    color: colors.textMuted,
  },
  dateValue: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 14,
    color: colors.text,
    marginTop: 2,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  countdownText: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 13,
    marginLeft: 6,
  },
  renewButton: {
    marginTop: spacing.xs,
  },
  cardSection: {
    marginBottom: spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: fontFamilies.heading,
    fontSize: 16,
    color: colors.primary,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: spacing.xs,
  },
  gridDayBox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gridDayPresent: {
    backgroundColor: `${colors.primary}25`,
    borderColor: colors.primary,
  },
  gridDayToday: {
    borderWidth: 2,
    borderColor: colors.white,
  },
  dayText: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 11,
    color: colors.textMuted,
  },
  dayTextPresent: {
    color: colors.primary,
    fontFamily: fontFamilies.bodyBold,
  },
  dayTextToday: {
    color: colors.white,
  },
  attendanceLegend: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendLabel: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 12,
    color: colors.textMuted,
  },
  emptyHistoryText: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 13,
    color: colors.textMuted,
    paddingVertical: spacing.sm,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  paymentAmount: {
    fontFamily: fontFamilies.heading,
    fontSize: 18,
    color: colors.text,
  },
  paymentDate: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 12,
    color: colors.textMuted,
  },
  paymentRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeBadge: {
    backgroundColor: colors.inputBackground,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeText: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 10,
    color: colors.primary,
  },
  notesBody: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
