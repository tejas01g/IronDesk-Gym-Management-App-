import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Banknote,
} from 'lucide-react-native';
import { addMonths, subMonths, format } from 'date-fns';
import { colors, fontFamilies, radius, spacing } from '../../theme';
import { RootStackParamList } from '../../app/navigation/types';
import { Payment, Member } from '../../types/models';
import { getPaymentsPaginated } from '../../services/payments';
import { getOverdueMembers } from '../../services/members';
import { getMonthKey, formatDateTime, formatDate } from '../../utils/dates';
import { formatINR } from '../../utils/money';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { Skeleton } from '../../components/Skeleton';
import { useGymStore } from '../../store/useGymStore';
import { useAccessGuard } from '../../hooks/useAccessGuard';
import { haptic } from '../../utils/haptics';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

type PaymentsNavProp = NativeStackNavigationProp<RootStackParamList>;

export const PaymentsScreen: React.FC = () => {
  useAccessGuard();
  const navigation = useNavigation<PaymentsNavProp>();
  const { gym, statsSummary } = useGymStore();

  const [selectedMonthDate, setSelectedMonthDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'RECENT' | 'PENDING'>('RECENT');

  const [payments, setPayments] = useState<Payment[]>([]);
  const [lastDoc, setLastDoc] = useState<FirebaseFirestoreTypes.QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const [pendingMembers, setPendingMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const monthKey = getMonthKey(selectedMonthDate);
  const monthDisplayTitle = format(selectedMonthDate, 'MMMM yyyy').toUpperCase();

  const collectedThisMonth = statsSummary?.collected?.[monthKey] || 0;
  const pendingThisMonth = statsSummary?.pending?.[monthKey] || 0;

  const loadData = async (isRefresh: boolean = false) => {
    if (!gym?.ownerUid) return;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      if (activeTab === 'RECENT') {
        const result = await getPaymentsPaginated(gym.ownerUid, monthKey, null);
        setPayments(result.payments);
        setLastDoc(result.lastDoc);
        setHasMore(result.hasMore);
      } else {
        const overdues = await getOverdueMembers(gym.ownerUid, 20);
        setPendingMembers(overdues);
      }
    } catch (e) {
      console.warn('[PaymentsScreen] Error loading data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [gym?.ownerUid, monthKey, activeTab]);

  const handlePrevMonth = () => {
    haptic.light();
    setSelectedMonthDate((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    haptic.light();
    setSelectedMonthDate((prev) => addMonths(prev, 1));
  };

  const renderPaymentItem = useCallback(
    ({ item }: { item: Payment }) => (
      <View style={styles.paymentCard}>
        <View style={styles.paymentMainInfo}>
          <View style={styles.modeIconCircle}>
            {item.mode === 'upi' ? (
              <QrCode size={18} color={colors.primary} />
            ) : (
              <Banknote size={18} color={colors.secondary} />
            )}
          </View>
          <View style={{ marginLeft: spacing.sm, flex: 1 }}>
            <Text numberOfLines={1} style={styles.paymentMemberName}>
              {item.memberName}
            </Text>
            <Text style={styles.paymentDate}>{formatDateTime(item.paidAt)}</Text>
          </View>
        </View>

        <View style={styles.amountBlock}>
          <Text style={styles.amountText}>{formatINR(item.amount)}</Text>
          <View style={styles.paidBadge}>
            <CheckCircle2 size={12} color={colors.success} />
            <Text style={styles.paidBadgeText}>PAID</Text>
          </View>
        </View>
      </View>
    ),
    []
  );

  const renderPendingItem = useCallback(
    ({ item }: { item: Member }) => (
      <View style={styles.pendingCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.pendingMemberName}>{item.name}</Text>
          <Text style={styles.pendingPlanText}>
            {item.planName} • Expired {formatDate(item.expiryDate)}
          </Text>
          <Text style={styles.pendingDueAmount}>Due: {formatINR(item.planPrice)}</Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            haptic.medium();
            navigation.navigate('CollectFee', { memberId: item.id, member: item });
          }}
          style={styles.collectMiniBtn}
          activeOpacity={0.8}
        >
          <CreditCard size={14} color={colors.black} />
          <Text style={styles.collectMiniText}>COLLECT</Text>
        </TouchableOpacity>
      </View>
    ),
    [navigation]
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>COLLECTIONS</Text>
          <Text style={styles.subtitle}>FEE REGISTER & DUES</Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            haptic.medium();
            navigation.navigate('CollectFee', {});
          }}
          style={styles.collectHeaderBtn}
          activeOpacity={0.8}
        >
          <Plus size={18} color={colors.black} />
          <Text style={styles.collectHeaderText}>COLLECT FEE</Text>
        </TouchableOpacity>
      </View>

      {/* Month Totals Card */}
      <View style={styles.totalsCardWrapper}>
        <Card style={styles.totalsCard} activeBorderColor={colors.primary}>
          {/* Month Switcher Row */}
          <View style={styles.monthSwitcherRow}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.arrowBtn}>
              <ChevronLeft size={20} color={colors.text} />
            </TouchableOpacity>

            <Text style={styles.monthTitle}>{monthDisplayTitle}</Text>

            <TouchableOpacity onPress={handleNextMonth} style={styles.arrowBtn}>
              <ChevronRight size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Stats Split Row */}
          <View style={styles.statsSplitRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>COLLECTED</Text>
              <Text style={styles.statCollectedValue}>
                {formatINR(collectedThisMonth)}
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>PENDING DUES</Text>
              <Text style={styles.statPendingValue}>
                {formatINR(pendingThisMonth)}
              </Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Segmented Tabs (Recent vs Pending) */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentTab, activeTab === 'RECENT' && styles.activeSegment]}
          onPress={() => {
            haptic.light();
            setActiveTab('RECENT');
          }}
        >
          <Text
            style={[
              styles.segmentText,
              activeTab === 'RECENT' && styles.activeSegmentText,
            ]}
          >
            RECENT PAID
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentTab, activeTab === 'PENDING' && styles.activeSegment]}
          onPress={() => {
            haptic.light();
            setActiveTab('PENDING');
          }}
        >
          <Text
            style={[
              styles.segmentText,
              activeTab === 'PENDING' && styles.activeSegmentText,
            ]}
          >
            OVERDUE / PENDING
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Lists */}
      {loading && !refreshing ? (
        <View style={styles.skeletonList}>
          <Skeleton height={68} borderRadius={radius.card} style={{ marginBottom: 12 }} />
          <Skeleton height={68} borderRadius={radius.card} style={{ marginBottom: 12 }} />
          <Skeleton height={68} borderRadius={radius.card} style={{ marginBottom: 12 }} />
        </View>
      ) : activeTab === 'RECENT' ? (
        payments.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="NO PAYMENTS THIS MONTH"
            description={`No member fee payments have been logged for ${monthDisplayTitle}.`}
            actionTitle="COLLECT FEE NOW"
            onAction={() => navigation.navigate('CollectFee', {})}
          />
        ) : (
          <View style={styles.listContainer}>
            <FlashList
              data={payments}
              renderItem={renderPaymentItem}
              keyExtractor={(item) => item.id}
              estimatedItemSize={72}
              contentContainerStyle={styles.listPadding}
              refreshing={refreshing}
              onRefresh={() => loadData(true)}
            />
          </View>
        )
      ) : pendingMembers.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="NO OVERDUE PAYMENTS"
          description="Great job! All members are active and up-to-date on their membership plans."
        />
      ) : (
        <View style={styles.listContainer}>
          <FlashList
            data={pendingMembers}
            renderItem={renderPendingItem}
            keyExtractor={(item) => item.id}
            estimatedItemSize={84}
            contentContainerStyle={styles.listPadding}
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    fontFamily: fontFamilies.heading,
    fontSize: 28,
    color: colors.text,
    letterSpacing: 1.2,
  },
  subtitle: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 1,
    marginTop: 2,
  },
  collectHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  collectHeaderText: {
    fontFamily: fontFamilies.heading,
    fontSize: 13,
    color: colors.black,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  totalsCardWrapper: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  totalsCard: {
    padding: spacing.md,
  },
  monthSwitcherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  arrowBtn: {
    padding: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.inputBackground,
  },
  monthTitle: {
    fontFamily: fontFamilies.heading,
    fontSize: 16,
    color: colors.text,
    letterSpacing: 1,
  },
  statsSplitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.borderLight,
  },
  statLabel: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  statCollectedValue: {
    fontFamily: fontFamilies.hero,
    fontSize: 28,
    color: colors.primary,
    marginTop: 2,
  },
  statPendingValue: {
    fontFamily: fontFamilies.hero,
    fontSize: 28,
    color: colors.secondary,
    marginTop: 2,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  activeSegment: {
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  segmentText: {
    fontFamily: fontFamilies.heading,
    fontSize: 13,
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  activeSegmentText: {
    color: colors.primary,
  },
  skeletonList: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  listContainer: {
    flex: 1,
  },
  listPadding: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 100,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.card,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  paymentMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modeIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentMemberName: {
    fontFamily: fontFamilies.heading,
    fontSize: 17,
    color: colors.text,
  },
  paymentDate: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 12,
    color: colors.textMuted,
  },
  amountBlock: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontFamily: fontFamilies.heading,
    fontSize: 20,
    color: colors.primary,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  paidBadgeText: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 10,
    color: colors.success,
    marginLeft: 3,
  },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.card,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pendingMemberName: {
    fontFamily: fontFamilies.heading,
    fontSize: 18,
    color: colors.text,
  },
  pendingPlanText: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 12,
    color: colors.textMuted,
  },
  pendingDueAmount: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 13,
    color: colors.secondary,
    marginTop: 2,
  },
  collectMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  collectMiniText: {
    fontFamily: fontFamilies.heading,
    fontSize: 12,
    color: colors.black,
    marginLeft: 4,
  },
});
