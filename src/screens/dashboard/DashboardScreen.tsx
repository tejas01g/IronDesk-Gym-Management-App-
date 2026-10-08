import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  TrendingUp,
  AlertTriangle,
  Users,
  UserPlus,
  UserCheck,
  UserX,
  CreditCard,
  RefreshCw,
  ChevronRight,
  ShieldCheck,
  Percent,
  Calendar,
} from 'lucide-react-native';
import firestore from '@react-native-firebase/firestore';
import { colors, fontFamilies, radius, spacing, shadows } from '../../theme';
import { RootStackParamList } from '../../app/navigation/types';
import { Member } from '../../types/models';
import { Card } from '../../components/Card';
import { useGymStore } from '../../store/useGymStore';
import { formatINR } from '../../utils/money';
import { getMonthKey, formatDate } from '../../utils/dates';
import { calculateMemberStatus } from '../../utils/memberStatus';
import { haptic } from '../../utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type DashboardNavProp = NativeStackNavigationProp<RootStackParamList>;

export const DashboardScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<DashboardNavProp>();
  const { gym, statsSummary, loadGymData } = useGymStore();

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const currentMonthKey = getMonthKey();

  const loadData = useCallback(async () => {
    if (!gym?.ownerUid) return;
    try {
      // Fetch all members for dynamic client breakdown & verification
      const snap = await firestore()
        .collection('gyms')
        .doc(gym.ownerUid)
        .collection('members')
        .get();

      const memberList: Member[] = snap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Member, 'id'>),
      }));

      setMembers(memberList);
    } catch (e) {
      console.warn('[DashboardScreen] Error fetching members:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [gym?.ownerUid]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (gym?.ownerUid) {
      await Promise.all([loadGymData(gym.ownerUid), loadData()]);
    } else {
      setRefreshing(false);
    }
  };

  // --- Financial Metrics ---
  const collectedMonth = statsSummary?.collected?.[currentMonthKey] || 0;
  const pendingMonth = statsSummary?.pending?.[currentMonthKey] || 0;
  const totalRevenue = collectedMonth + pendingMonth;
  const collectionPercentage =
    totalRevenue > 0 ? Math.round((collectedMonth / totalRevenue) * 100) : 0;

  // --- Client Metrics Breakdown ---
  const clientBreakdown = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let newCount = 0;
    let repeatCount = 0;
    let lostCount = 0;

    let newRevenue = 0;
    let repeatRevenue = 0;
    let lostPending = 0;

    members.forEach((m) => {
      const dynamicStatus = calculateMemberStatus(m.expiryDate);
      const createdDate = m.createdAt ? m.createdAt.toDate() : new Date();
      const isRecentlyCreated = createdDate >= thirtyDaysAgo;

      if (dynamicStatus === 'expired') {
        lostCount += 1;
        lostPending += m.planPrice || 0;
      } else if (isRecentlyCreated) {
        newCount += 1;
        newRevenue += m.planPrice || 0;
      } else {
        repeatCount += 1;
        repeatRevenue += m.planPrice || 0;
      }
    });

    const totalClients = members.length;
    const newPercent = totalClients > 0 ? Math.round((newCount / totalClients) * 100) : 0;
    const repeatPercent = totalClients > 0 ? Math.round((repeatCount / totalClients) * 100) : 0;
    const lostPercent = totalClients > 0 ? Math.round((lostCount / totalClients) * 100) : 0;

    return {
      totalClients,
      newCount,
      repeatCount,
      lostCount,
      newPercent,
      repeatPercent,
      lostPercent,
      newRevenue,
      repeatRevenue,
      lostPending,
    };
  }, [members]);

  // Plan distribution breakdown
  const planDistribution = useMemo(() => {
    const counts: Record<string, { name: string; count: number; revenue: number }> = {};
    members.forEach((m) => {
      const planName = m.planName || 'Standard';
      if (!counts[planName]) {
        counts[planName] = { name: planName, count: 0, revenue: 0 };
      }
      counts[planName].count += 1;
      counts[planName].revenue += m.planPrice || 0;
    });
    return Object.values(counts).sort((a, b) => b.count - a.count);
  }, [members]);

  // SVG Donut Chart Constants for Revenue
  const revSize = 170;
  const revStrokeWidth = 16;
  const revRadius = (revSize - revStrokeWidth) / 2;
  const revCircumference = 2 * Math.PI * revRadius;

  const collectedRatio = totalRevenue > 0 ? collectedMonth / totalRevenue : 0;
  const pendingRatio = totalRevenue > 0 ? pendingMonth / totalRevenue : 0;

  const collectedStroke = revCircumference * collectedRatio;
  const pendingStroke = revCircumference * pendingRatio;

  // SVG Donut Chart Constants for Clients
  const clientSize = 170;
  const clientStrokeWidth = 16;
  const clientRadius = (clientSize - clientStrokeWidth) / 2;
  const clientCircumference = 2 * Math.PI * clientRadius;

  const totalClientsSafe = clientBreakdown.totalClients || 1;
  const newRatio = clientBreakdown.totalClients > 0 ? clientBreakdown.newCount / totalClientsSafe : 0;
  const repeatRatio = clientBreakdown.totalClients > 0 ? clientBreakdown.repeatCount / totalClientsSafe : 0;
  const lostRatio = clientBreakdown.totalClients > 0 ? clientBreakdown.lostCount / totalClientsSafe : 0;

  const newStroke = clientCircumference * newRatio;
  const repeatStroke = clientCircumference * repeatRatio;
  const lostStroke = clientCircumference * lostRatio;

  const activeRatio =
    clientBreakdown.totalClients > 0
      ? Math.round(
          ((clientBreakdown.newCount + clientBreakdown.repeatCount) /
            clientBreakdown.totalClients) *
            100
        )
      : 0;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 110 + insets.bottom },
        ]}
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
            <Text style={styles.title}>DASHBOARD</Text>
            <Text style={styles.subtitle}>
              BUSINESS ANALYTICS & INSIGHTS
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => {
              haptic.light();
              onRefresh();
            }}
            style={styles.refreshBtn}
            activeOpacity={0.8}
          >
            <RefreshCw size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* ======================================================== */}
        {/* 1. CIRCULAR REVENUE GRAPH */}
        {/* ======================================================== */}
        <Card style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardSectionTitle}>MONTHLY REVENUE OVERVIEW</Text>
              <Text style={styles.periodText}>Cycle: {currentMonthKey}</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Main', { screen: 'PaymentsTab' })}
              style={styles.viewPaymentsBtn}
            >
              <Text style={styles.viewPaymentsText}>PAYMENTS</Text>
              <ChevronRight size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Circular Chart Row */}
          <View style={styles.chartWrapper}>
            <View style={styles.svgContainer}>
              <Svg width={revSize} height={revSize}>
                <G rotation="-90" origin={`${revSize / 2}, ${revSize / 2}`}>
                  {/* Background Track */}
                  <Circle
                    cx={revSize / 2}
                    cy={revSize / 2}
                    r={revRadius}
                    stroke={colors.elevated}
                    strokeWidth={revStrokeWidth}
                    fill="none"
                  />

                  {/* Collected Segment (Primary Lime) */}
                  {totalRevenue > 0 && (
                    <Circle
                      cx={revSize / 2}
                      cy={revSize / 2}
                      r={revRadius}
                      stroke={colors.primary}
                      strokeWidth={revStrokeWidth}
                      strokeDasharray={`${collectedStroke} ${revCircumference}`}
                      strokeDashoffset={0}
                      strokeLinecap="round"
                      fill="none"
                    />
                  )}

                  {/* Pending Segment (Secondary Amber) */}
                  {totalRevenue > 0 && pendingStroke > 0 && (
                    <Circle
                      cx={revSize / 2}
                      cy={revSize / 2}
                      r={revRadius}
                      stroke={colors.secondary}
                      strokeWidth={revStrokeWidth}
                      strokeDasharray={`${pendingStroke} ${revCircumference}`}
                      strokeDashoffset={-collectedStroke}
                      strokeLinecap="round"
                      fill="none"
                    />
                  )}
                </G>
              </Svg>

              {/* Center Metrics in Circle */}
              <View style={styles.chartCenterContent}>
                <Text style={styles.centerPercentage}>{collectionPercentage}%</Text>
                <Text style={styles.centerLabel}>COLLECTED</Text>
              </View>
            </View>

            {/* Side Metric Details */}
            <View style={styles.legendContainer}>
              {/* Collected Item */}
              <View style={styles.legendRow}>
                <View style={[styles.colorIndicator, { backgroundColor: colors.primary }]} />
                <View style={styles.legendTextCol}>
                  <Text style={styles.legendLabel}>COLLECTED</Text>
                  <Text style={[styles.legendValue, { color: colors.primary }]}>
                    {formatINR(collectedMonth)}
                  </Text>
                  <Text style={styles.legendSubtext}>
                    {totalRevenue > 0 ? `${collectionPercentage}% of total` : 'No payments yet'}
                  </Text>
                </View>
              </View>

              {/* Pending Item */}
              <View style={[styles.legendRow, { marginTop: spacing.md }]}>
                <View style={[styles.colorIndicator, { backgroundColor: colors.secondary }]} />
                <View style={styles.legendTextCol}>
                  <Text style={styles.legendLabel}>PENDING DUES</Text>
                  <Text style={[styles.legendValue, { color: colors.secondary }]}>
                    {formatINR(pendingMonth)}
                  </Text>
                  <Text style={styles.legendSubtext}>
                    {totalRevenue > 0
                      ? `${100 - collectionPercentage}% pending collection`
                      : 'Zero dues pending'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Total Revenue Banner Footnote */}
          <View style={styles.totalFootnote}>
            <View style={styles.totalFootnoteLeft}>
              <Text style={styles.totalFootnoteLabel}>TOTAL EXPECTED REVENUE</Text>
              <Text style={styles.totalFootnoteValue}>{formatINR(totalRevenue)}</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('CollectFee', {})}
              style={styles.collectActionPill}
              activeOpacity={0.85}
            >
              <CreditCard size={14} color={colors.black} />
              <Text style={styles.collectActionText}>COLLECT DUES</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* ======================================================== */}
        {/* 2. CLIENT HEALTH & RETENTION CHART (NEW, REPEAT, LOST) */}
        {/* ======================================================== */}
        <Card style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardSectionTitle}>CLIENT ACQUISITION & RETENTION</Text>
              <Text style={styles.periodText}>
                Active Retention Rate: <Text style={{ color: colors.primary, fontFamily: fontFamilies.bodyBold }}>{activeRatio}%</Text>
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Main', { screen: 'MembersTab' })}
              style={styles.viewPaymentsBtn}
            >
              <Text style={styles.viewPaymentsText}>MEMBERS</Text>
              <ChevronRight size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Client Breakdown Chart */}
          <View style={styles.chartWrapper}>
            <View style={styles.svgContainer}>
              <Svg width={clientSize} height={clientSize}>
                <G rotation="-90" origin={`${clientSize / 2}, ${clientSize / 2}`}>
                  {/* Background Track */}
                  <Circle
                    cx={clientSize / 2}
                    cy={clientSize / 2}
                    r={clientRadius}
                    stroke={colors.elevated}
                    strokeWidth={clientStrokeWidth}
                    fill="none"
                  />

                  {clientBreakdown.totalClients > 0 && (
                    <>
                      {/* Repeat Clients Segment (Neon Lime) */}
                      {repeatStroke > 0 && (
                        <Circle
                          cx={clientSize / 2}
                          cy={clientSize / 2}
                          r={clientRadius}
                          stroke={colors.primary}
                          strokeWidth={clientStrokeWidth}
                          strokeDasharray={`${repeatStroke} ${clientCircumference}`}
                          strokeDashoffset={0}
                          strokeLinecap="round"
                          fill="none"
                        />
                      )}

                      {/* New Clients Segment (Cyan Info) */}
                      {newStroke > 0 && (
                        <Circle
                          cx={clientSize / 2}
                          cy={clientSize / 2}
                          r={clientRadius}
                          stroke={colors.info}
                          strokeWidth={clientStrokeWidth}
                          strokeDasharray={`${newStroke} ${clientCircumference}`}
                          strokeDashoffset={-repeatStroke}
                          strokeLinecap="round"
                          fill="none"
                        />
                      )}

                      {/* Lost Clients Segment (Red Danger) */}
                      {lostStroke > 0 && (
                        <Circle
                          cx={clientSize / 2}
                          cy={clientSize / 2}
                          r={clientRadius}
                          stroke={colors.danger}
                          strokeWidth={clientStrokeWidth}
                          strokeDasharray={`${lostStroke} ${clientCircumference}`}
                          strokeDashoffset={-(repeatStroke + newStroke)}
                          strokeLinecap="round"
                          fill="none"
                        />
                      )}
                    </>
                  )}
                </G>
              </Svg>

              {/* Center Metrics in Circle */}
              <View style={styles.chartCenterContent}>
                <Text style={styles.centerPercentage}>{clientBreakdown.totalClients}</Text>
                <Text style={styles.centerLabel}>TOTAL CLIENTS</Text>
              </View>
            </View>

            {/* Side Client Legend */}
            <View style={styles.legendContainer}>
              {/* Repeat Clients */}
              <View style={styles.clientLegendItem}>
                <View style={styles.clientLegendHeader}>
                  <View style={[styles.clientDot, { backgroundColor: colors.primary }]} />
                  <Text style={styles.clientTitle}>REPEAT CLIENTS</Text>
                </View>
                <View style={styles.clientValuesRow}>
                  <Text style={[styles.clientCountText, { color: colors.primary }]}>
                    {clientBreakdown.repeatCount}
                  </Text>
                  <Text style={styles.clientPercentBadge}>
                    {clientBreakdown.repeatPercent}%
                  </Text>
                </View>
                <Text style={styles.clientDescText}>Loyal & active members</Text>
              </View>

              {/* New Clients */}
              <View style={[styles.clientLegendItem, { marginTop: spacing.sm }]}>
                <View style={styles.clientLegendHeader}>
                  <View style={[styles.clientDot, { backgroundColor: colors.info }]} />
                  <Text style={styles.clientTitle}>NEW CLIENTS</Text>
                </View>
                <View style={styles.clientValuesRow}>
                  <Text style={[styles.clientCountText, { color: colors.info }]}>
                    {clientBreakdown.newCount}
                  </Text>
                  <Text style={styles.clientPercentBadge}>
                    {clientBreakdown.newPercent}%
                  </Text>
                </View>
                <Text style={styles.clientDescText}>Joined last 30 days</Text>
              </View>

              {/* Lost Clients */}
              <View style={[styles.clientLegendItem, { marginTop: spacing.sm }]}>
                <View style={styles.clientLegendHeader}>
                  <View style={[styles.clientDot, { backgroundColor: colors.danger }]} />
                  <Text style={styles.clientTitle}>LOST CLIENTS</Text>
                </View>
                <View style={styles.clientValuesRow}>
                  <Text style={[styles.clientCountText, { color: colors.danger }]}>
                    {clientBreakdown.lostCount}
                  </Text>
                  <Text style={styles.clientPercentBadge}>
                    {clientBreakdown.lostPercent}%
                  </Text>
                </View>
                <Text style={styles.clientDescText}>Expired / churned</Text>
              </View>
            </View>
          </View>

          {/* Detail Cards Row */}
          <View style={styles.clientCardsRow}>
            {/* New Client Card */}
            <View style={[styles.metricBox, { borderLeftColor: colors.info, borderLeftWidth: 3 }]}>
              <View style={styles.metricBoxTop}>
                <UserPlus size={16} color={colors.info} />
                <Text style={styles.metricBoxTag}>NEW</Text>
              </View>
              <Text style={styles.metricBoxCount}>{clientBreakdown.newCount}</Text>
              <Text style={styles.metricBoxSub}>
                {formatINR(clientBreakdown.newRevenue)} added
              </Text>
            </View>

            {/* Repeat Client Card */}
            <View style={[styles.metricBox, { borderLeftColor: colors.primary, borderLeftWidth: 3 }]}>
              <View style={styles.metricBoxTop}>
                <UserCheck size={16} color={colors.primary} />
                <Text style={styles.metricBoxTag}>REPEAT</Text>
              </View>
              <Text style={styles.metricBoxCount}>{clientBreakdown.repeatCount}</Text>
              <Text style={styles.metricBoxSub}>
                {formatINR(clientBreakdown.repeatRevenue)} value
              </Text>
            </View>

            {/* Lost Client Card */}
            <View style={[styles.metricBox, { borderLeftColor: colors.danger, borderLeftWidth: 3 }]}>
              <View style={styles.metricBoxTop}>
                <UserX size={16} color={colors.danger} />
                <Text style={styles.metricBoxTag}>LOST</Text>
              </View>
              <Text style={styles.metricBoxCount}>{clientBreakdown.lostCount}</Text>
              <Text style={styles.metricBoxSub}>
                {formatINR(clientBreakdown.lostPending)} due
              </Text>
            </View>
          </View>
        </Card>

        {/* ======================================================== */}
        {/* 3. MEMBERSHIP PLANS POPULARITY */}
        {/* ======================================================== */}
        <Card style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardSectionTitle}>MEMBERSHIP PLAN POPULARITY</Text>
              <Text style={styles.periodText}>Plan breakdown & distribution</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('ManagePlans')}
              style={styles.viewPaymentsBtn}
            >
              <Text style={styles.viewPaymentsText}>EDIT PLANS</Text>
              <ChevronRight size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {planDistribution.length === 0 ? (
            <Text style={styles.emptyPlanText}>No plan subscription data yet.</Text>
          ) : (
            planDistribution.slice(0, 4).map((plan, idx) => {
              const sharePercent =
                clientBreakdown.totalClients > 0
                  ? Math.round((plan.count / clientBreakdown.totalClients) * 100)
                  : 0;
              return (
                <View key={plan.name} style={styles.planDistRow}>
                  <View style={styles.planDistHeader}>
                    <Text style={styles.planDistName}>{plan.name}</Text>
                    <Text style={styles.planDistRevenue}>
                      {plan.count} members ({sharePercent}%)
                    </Text>
                  </View>

                  <View style={styles.planProgressBarBg}>
                    <View
                      style={[
                        styles.planProgressBarFill,
                        {
                          width: `${Math.max(sharePercent, 4)}%`,
                          backgroundColor: idx === 0 ? colors.primary : colors.info,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 110,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fontFamilies.heading,
    fontSize: 26,
    color: colors.text,
    letterSpacing: 1,
  },
  subtitle: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  refreshBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionCard: {
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cardSectionTitle: {
    fontFamily: fontFamilies.heading,
    fontSize: 16,
    color: colors.text,
    letterSpacing: 0.8,
  },
  periodText: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  viewPaymentsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.xs,
    backgroundColor: colors.primarySoft,
  },
  viewPaymentsText: {
    fontFamily: fontFamilies.heading,
    fontSize: 11,
    color: colors.primary,
    letterSpacing: 0.5,
    marginRight: 2,
  },
  chartWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: spacing.sm,
  },
  svgContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  chartCenterContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPercentage: {
    fontFamily: fontFamilies.heading,
    fontSize: 24,
    color: colors.text,
    letterSpacing: 0.5,
  },
  centerLabel: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 9,
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginTop: 1,
  },
  legendContainer: {
    flex: 1,
    marginLeft: spacing.lg,
    justifyContent: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  colorIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    marginRight: spacing.sm,
  },
  legendTextCol: {
    flex: 1,
  },
  legendLabel: {
    fontFamily: fontFamilies.heading,
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  legendValue: {
    fontFamily: fontFamilies.heading,
    fontSize: 18,
    letterSpacing: 0.5,
    marginTop: 1,
  },
  legendSubtext: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  totalFootnote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  totalFootnoteLeft: {
    flex: 1,
  },
  totalFootnoteLabel: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  totalFootnoteValue: {
    fontFamily: fontFamilies.heading,
    fontSize: 18,
    color: colors.text,
    marginTop: 2,
  },
  collectActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  collectActionText: {
    fontFamily: fontFamilies.heading,
    fontSize: 11,
    color: colors.black,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  clientLegendItem: {
    marginBottom: 2,
  },
  clientLegendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  clientTitle: {
    fontFamily: fontFamilies.heading,
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  clientValuesRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  clientCountText: {
    fontFamily: fontFamilies.heading,
    fontSize: 18,
    marginRight: 6,
  },
  clientPercentBadge: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 11,
    color: colors.textMuted,
  },
  clientDescText: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 10,
    color: colors.textMuted,
  },
  clientCardsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  metricBox: {
    flex: 1,
    backgroundColor: colors.inputBackground,
    padding: spacing.sm,
    borderRadius: radius.card,
  },
  metricBoxTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricBoxTag: {
    fontFamily: fontFamilies.heading,
    fontSize: 9,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  metricBoxCount: {
    fontFamily: fontFamilies.heading,
    fontSize: 18,
    color: colors.text,
    marginVertical: 2,
  },
  metricBoxSub: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 10,
    color: colors.textMuted,
  },
  planDistRow: {
    marginBottom: spacing.md,
  },
  planDistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  planDistName: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 13,
    color: colors.text,
  },
  planDistRevenue: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 11,
    color: colors.textMuted,
  },
  planProgressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.elevated,
    overflow: 'hidden',
  },
  planProgressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  emptyPlanText: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 12,
    color: colors.textMuted,
    paddingVertical: spacing.sm,
  },
});
