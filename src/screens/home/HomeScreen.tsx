import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Bell,
  Settings,
  Plus,
  CreditCard,
  LayoutDashboard,
  TrendingUp,
  AlertTriangle,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  MessageSquare,
  ChevronRight,
} from 'lucide-react-native';
import { colors, fontFamilies, radius, spacing } from '../../theme';
import { RootStackParamList } from '../../app/navigation/types';
import { Member } from '../../types/models';
import { getExpiringMembers, getOverdueMembers } from '../../services/members';
import { subscribeToStatsSummary } from '../../services/stats';
import { getMonthKey, getTodayDateKey, formatDate } from '../../utils/dates';
import { formatINR } from '../../utils/money';
import { openWhatsApp, formatWhatsAppMessage } from '../../utils/whatsapp';
import { generateUpiUrl } from '../../utils/upi';
import { getExpiryCountdownText } from '../../utils/memberStatus';
import { StatCard } from '../../components/StatCard';
import { Card } from '../../components/Card';
import { useGymStore } from '../../store/useGymStore';
import { useAccessGuard } from '../../hooks/useAccessGuard';
import { haptic } from '../../utils/haptics';

type HomeNavProp = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen: React.FC = () => {
  useAccessGuard();
  const navigation = useNavigation<HomeNavProp>();
  const { gym, statsSummary, setStatsSummary, loadGymData } = useGymStore();

  const [expiringMembers, setExpiringMembers] = useState<Member[]>([]);
  const [overdueMembers, setOverdueMembers] = useState<Member[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const currentMonthKey = getMonthKey();
  const todayDateKey = getTodayDateKey();

  const collectedMonth = statsSummary?.collected?.[currentMonthKey] || 0;
  const pendingMonth = statsSummary?.pending?.[currentMonthKey] || 0;
  const totalMembers = statsSummary?.totalMembers || 0;
  const activeMembers = statsSummary?.activeMembers || 0;

  // Real-time listener for the stats/summary doc
  useEffect(() => {
    if (!gym?.ownerUid) return;

    const unsubscribe = subscribeToStatsSummary(gym.ownerUid, (newStats) => {
      if (newStats) setStatsSummary(newStats);
    });

    return () => unsubscribe();
  }, [gym?.ownerUid]);

  // Load the two small queries for dashboard
  const loadDashboardData = async () => {
    if (!gym?.ownerUid) return;
    try {
      const [expiring, overdue] = await Promise.all([
        getExpiringMembers(gym.ownerUid, 10),
        getOverdueMembers(gym.ownerUid, 10),
      ]);
      setExpiringMembers(expiring);
      setOverdueMembers(overdue);
    } catch (e) {
      console.warn('[HomeScreen] Error loading dashboard lists:', e);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [gym?.ownerUid]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (gym?.ownerUid) {
      await Promise.all([loadGymData(gym.ownerUid), loadDashboardData()]);
    }
    setRefreshing(false);
  };

  const handleSendReminder = async (member: Member) => {
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

  const expiringBadgeCount = statsSummary?.expiringCount || 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.gymName} numberOfLines={1}>
              {gym?.gymName || 'IRONDESK GYM'}
            </Text>
            <Text style={styles.ownerSubtitle}>
              Welcome back, {gym?.ownerName || 'Trainer'}
            </Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => {
                haptic.light();
                navigation.navigate('Notifications');
              }}
              style={styles.headerIconBtn}
            >
              <Bell size={20} color={colors.text} />
              {expiringBadgeCount > 0 && (
                <View style={styles.badgeDot}>
                  <Text style={styles.badgeText}>{expiringBadgeCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                haptic.light();
                navigation.navigate('Main', { screen: 'SettingsTab' });
              }}
              style={styles.headerIconBtn}
            >
              <Settings size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Trial or Active Plan Banner */}
        {gym?.planStatus === 'trial' && (
          <View style={styles.trialBanner}>
            <Sparkles size={16} color={colors.primary} />
            <Text style={styles.trialText}>
              FREE TRIAL ACTIVE • All features unlocked
            </Text>
          </View>
        )}

        {/* 4 Stat Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard
              label="COLLECTED THIS MONTH"
              value={collectedMonth}
              formattedValue={formatINR(collectedMonth)}
              icon={TrendingUp}
              accentColor={colors.primary}
              onPress={() => navigation.navigate('Main', { screen: 'PaymentsTab' })}
            />
            <StatCard
              label="PENDING DUES"
              value={pendingMonth}
              formattedValue={formatINR(pendingMonth)}
              icon={AlertTriangle}
              accentColor={colors.secondary}
              onPress={() => navigation.navigate('Main', { screen: 'PaymentsTab' })}
            />
          </View>

          <View style={styles.statsRow}>
            <StatCard
              label="TOTAL MEMBERS"
              value={totalMembers}
              icon={Users}
              accentColor={colors.info}
              onPress={() => navigation.navigate('Main', { screen: 'MembersTab' })}
            />
            <StatCard
              label="ACTIVE MEMBERS"
              value={activeMembers}
              icon={CheckCircle2}
              accentColor={colors.success}
              onPress={() => navigation.navigate('Main', { screen: 'MembersTab' })}
            />
          </View>
        </View>

        {/* Quick Actions Row */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionHeading}>QUICK ACTIONS</Text>
          <View style={styles.actionButtonsGrid}>
            <TouchableOpacity
              style={[styles.actionCard, { borderColor: colors.primary }]}
              onPress={() => {
                haptic.medium();
                navigation.navigate('AddMember', {});
              }}
              activeOpacity={0.85}
            >
              <View style={[styles.actionIconBadge, { backgroundColor: colors.primary }]}>
                <Plus size={20} color={colors.black} />
              </View>
              <Text style={styles.actionCardText}>+ MEMBER</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => {
                haptic.medium();
                navigation.navigate('CollectFee', {});
              }}
              activeOpacity={0.85}
            >
              <View style={[styles.actionIconBadge, { backgroundColor: colors.surface }]}>
                <CreditCard size={20} color={colors.primary} />
              </View>
              <Text style={styles.actionCardText}>COLLECT FEE</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => {
                haptic.medium();
                navigation.navigate('Main', { screen: 'DashboardTab' });
              }}
              activeOpacity={0.85}
            >
              <View style={[styles.actionIconBadge, { backgroundColor: colors.surface }]}>
                <LayoutDashboard size={20} color={colors.info} />
              </View>
              <Text style={styles.actionCardText}>DASHBOARD</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Expiring in 7 Days Section */}
        <View style={styles.listSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Clock size={16} color={colors.secondary} />
              <Text style={[styles.sectionHeading, { marginLeft: 6, marginBottom: 0 }]}>
                EXPIRING IN 7 DAYS ({expiringMembers.length})
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Main', { screen: 'MembersTab' })}
            >
              <Text style={styles.seeAllText}>VIEW ALL</Text>
            </TouchableOpacity>
          </View>

          {expiringMembers.length === 0 ? (
            <Card style={styles.emptyCard}>
              <CheckCircle2 size={24} color={colors.success} />
              <Text style={styles.emptyCardText}>No members expiring in the next 7 days.</Text>
            </Card>
          ) : (
            expiringMembers.map((m) => (
              <Card
                key={m.id}
                style={styles.memberRowCard}
                activeBorderColor={colors.secondary}
                onPress={() => navigation.navigate('MemberDetail', { memberId: m.id })}
              >
                <View style={styles.rowMainInfo}>
                  <View>
                    <Text style={styles.rowName}>{m.name}</Text>
                    <Text style={styles.rowPlan}>{m.planName} • {formatINR(m.planPrice)}</Text>
                  </View>
                  <Text style={styles.countdownWarning}>
                    {getExpiryCountdownText(m.expiryDate)}
                  </Text>
                </View>

                <View style={styles.rowActions}>
                  <TouchableOpacity
                    onPress={() => handleSendReminder(m)}
                    style={styles.remindBtn}
                    activeOpacity={0.8}
                  >
                    <MessageSquare size={14} color={colors.whatsapp} />
                    <Text style={styles.remindBtnText}>REMIND</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('CollectFee', { memberId: m.id, member: m })
                    }
                    style={styles.payBtn}
                    activeOpacity={0.8}
                  >
                    <CreditCard size={14} color={colors.black} />
                    <Text style={styles.payBtnText}>RENEW</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          )}
        </View>

        {/* Overdue / Expired Section */}
        <View style={styles.listSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AlertTriangle size={16} color={colors.danger} />
              <Text style={[styles.sectionHeading, { marginLeft: 6, marginBottom: 0 }]}>
                OVERDUE MEMBERS ({overdueMembers.length})
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Main', { screen: 'MembersTab' })}
            >
              <Text style={styles.seeAllText}>VIEW ALL</Text>
            </TouchableOpacity>
          </View>

          {overdueMembers.length === 0 ? (
            <Card style={styles.emptyCard}>
              <CheckCircle2 size={24} color={colors.success} />
              <Text style={styles.emptyCardText}>Zero overdue members. Great work!</Text>
            </Card>
          ) : (
            overdueMembers.map((m) => (
              <Card
                key={m.id}
                style={styles.memberRowCard}
                activeBorderColor={colors.danger}
                onPress={() => navigation.navigate('MemberDetail', { memberId: m.id })}
              >
                <View style={styles.rowMainInfo}>
                  <View>
                    <Text style={styles.rowName}>{m.name}</Text>
                    <Text style={styles.rowPlan}>{m.planName} • Due: {formatINR(m.planPrice)}</Text>
                  </View>
                  <Text style={styles.countdownDanger}>
                    {getExpiryCountdownText(m.expiryDate)}
                  </Text>
                </View>

                <View style={styles.rowActions}>
                  <TouchableOpacity
                    onPress={() => handleSendReminder(m)}
                    style={styles.remindBtn}
                    activeOpacity={0.8}
                  >
                    <MessageSquare size={14} color={colors.whatsapp} />
                    <Text style={styles.remindBtnText}>REMIND</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('CollectFee', { memberId: m.id, member: m })
                    }
                    style={styles.payBtn}
                    activeOpacity={0.8}
                  >
                    <CreditCard size={14} color={colors.black} />
                    <Text style={styles.payBtnText}>MARK PAID</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 110,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  gymName: {
    fontFamily: fontFamilies.heading,
    fontSize: 26,
    color: colors.text,
    letterSpacing: 1,
  },
  ownerSubtitle: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.secondary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 9,
    color: colors.white,
  },
  trialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: radius.card,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderAccent,
  },
  trialText: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 11,
    color: colors.primary,
    marginLeft: spacing.xs,
    letterSpacing: 0.5,
  },
  statsGrid: {
    marginVertical: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quickActionsContainer: {
    marginVertical: spacing.md,
  },
  sectionHeading: {
    fontFamily: fontFamilies.heading,
    fontSize: 16,
    color: colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  actionButtonsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  actionCardText: {
    fontFamily: fontFamilies.heading,
    fontSize: 12,
    color: colors.text,
    letterSpacing: 0.5,
  },
  listSection: {
    marginTop: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  seeAllText: {
    fontFamily: fontFamilies.heading,
    fontSize: 12,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  emptyCardText: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 13,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
  memberRowCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowName: {
    fontFamily: fontFamilies.heading,
    fontSize: 18,
    color: colors.text,
  },
  rowPlan: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 12,
    color: colors.textMuted,
  },
  countdownWarning: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 12,
    color: colors.secondary,
  },
  countdownDanger: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 12,
    color: colors.danger,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: spacing.sm,
  },
  remindBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: `${colors.whatsapp}40`,
  },
  remindBtnText: {
    fontFamily: fontFamilies.heading,
    fontSize: 11,
    color: colors.whatsapp,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  payBtnText: {
    fontFamily: fontFamilies.heading,
    fontSize: 11,
    color: colors.black,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
});
