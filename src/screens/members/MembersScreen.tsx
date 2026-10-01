import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Search,
  Plus,
  X,
  Users,
  Phone,
  MessageSquare,
  CreditCard,
  Edit3,
  Calendar,
  Clock,
  ChevronRight,
  FileText,
} from 'lucide-react-native';
import firestore from '@react-native-firebase/firestore';
import { colors, fontFamilies, radius, spacing } from '../../theme';
import { RootStackParamList } from '../../app/navigation/types';
import { Member, MemberStatus } from '../../types/models';
import { MemberCard } from '../../components/MemberCard';
import { Chip } from '../../components/Chip';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { MemberCardSkeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { useGymStore } from '../../store/useGymStore';
import { useDebounce } from '../../hooks/useDebounce';
import { useAccessGuard } from '../../hooks/useAccessGuard';
import { calculateMemberStatus, getExpiryCountdownText } from '../../utils/memberStatus';
import { formatDate } from '../../utils/dates';
import { formatINR } from '../../utils/money';
import { openWhatsApp, makePhoneCall, formatWhatsAppMessage } from '../../utils/whatsapp';
import { generateUpiUrl } from '../../utils/upi';
import { haptic } from '../../utils/haptics';

type MembersNavProp = NativeStackNavigationProp<RootStackParamList>;

export const MembersScreen: React.FC = () => {
  useAccessGuard();
  const navigation = useNavigation<MembersNavProp>();
  const { gym, statsSummary, loadGymData } = useGymStore();

  const [filter, setFilter] = useState<'all' | MemberStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 250);

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Selected member for overview modal
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Fetch all gym members
  const fetchMembers = async (isRefresh: boolean = false) => {
    if (!gym?.ownerUid) return;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const snap = await firestore()
        .collection('gyms')
        .doc(gym.ownerUid)
        .collection('members')
        .orderBy('createdAt', 'desc')
        .get();

      const memberList: Member[] = snap.docs.map((doc) => {
        const data = doc.data() as Omit<Member, 'id'>;
        const dynamicStatus = calculateMemberStatus(data.expiryDate);
        return {
          id: doc.id,
          ...data,
          status: dynamicStatus,
        };
      });

      setMembers(memberList);
    } catch (error) {
      console.warn('[MembersScreen] Error loading members:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [gym?.ownerUid]);

  // Compute live, accurate counts for filter chips
  const filterCounts = useMemo(() => {
    let active = 0;
    let expiring = 0;
    let expired = 0;

    members.forEach((m) => {
      const s = calculateMemberStatus(m.expiryDate);
      if (s === 'active') active++;
      else if (s === 'expiring') expiring++;
      else if (s === 'expired') expired++;
    });

    return {
      all: members.length,
      active: active || statsSummary?.activeMembers || 0,
      expiring: expiring || statsSummary?.expiringCount || 0,
      expired: expired || statsSummary?.expiredCount || 0,
    };
  }, [members, statsSummary]);

  // Instant, robust client-side filter
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // 1. Status Filter Check
      const dynamicStatus = calculateMemberStatus(m.expiryDate);
      if (filter !== 'all' && dynamicStatus !== filter) {
        return false;
      }

      // 2. Search Query Check
      if (!debouncedSearch.trim()) return true;
      const query = debouncedSearch.toLowerCase().trim();
      return (
        m.name.toLowerCase().includes(query) ||
        m.phone.includes(query) ||
        (m.planName && m.planName.toLowerCase().includes(query))
      );
    });
  }, [members, filter, debouncedSearch]);

  const handleOpenOverview = (member: Member) => {
    haptic.light();
    setSelectedMember(member);
  };

  const handleCloseOverview = () => {
    setSelectedMember(null);
  };

  const handleSendReminder = async (m: Member) => {
    haptic.medium();
    const upiLink = generateUpiUrl({
      upiId: gym?.upiId || '',
      name: gym?.gymName || 'Gym',
      amount: m.planPrice || 1000,
      note: 'Gym Membership Renewal',
    });

    const template = gym?.reminderTemplate || '';
    const message = formatWhatsAppMessage({
      template,
      name: m.name,
      gym: gym?.gymName || 'Our Gym',
      expiry: formatDate(m.expiryDate),
      amount: formatINR(m.planPrice),
      upiLink,
    });

    await openWhatsApp(m.phone, message);
  };

  const renderMemberItem = useCallback(
    ({ item }: { item: Member }) => (
      <MemberCard
        member={item}
        onPress={() => handleOpenOverview(item)}
        onCollectFee={() =>
          navigation.navigate('CollectFee', { memberId: item.id, member: item })
        }
      />
    ),
    [navigation]
  );

  const getStatusColor = (status: MemberStatus) => {
    switch (status) {
      case 'active':
        return colors.statusActive;
      case 'expiring':
        return colors.statusExpiring;
      case 'expired':
      default:
        return colors.statusExpired;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>MEMBERS</Text>
          <Text style={styles.subtitle}>
            {filterCounts.all} TOTAL ADMISSIONS
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            haptic.medium();
            navigation.navigate('AddMember', {});
          }}
          style={styles.addHeaderBtn}
          activeOpacity={0.8}
        >
          <Plus size={18} color={colors.black} />
          <Text style={styles.addHeaderText}>ADD MEMBER</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchSection}>
        <Input
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by name, mobile, or plan..."
          prefix={<Search size={18} color={colors.textMuted} />}
          suffix={
            searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color={colors.textMuted} />
              </TouchableOpacity>
            ) : undefined
          }
          containerStyle={styles.searchInputContainer}
        />
      </View>

      {/* Filter Chips - Guaranteed Live Working Filter */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Chip
            label="ALL"
            count={filterCounts.all}
            selected={filter === 'all'}
            onPress={() => {
              haptic.light();
              setFilter('all');
            }}
          />
          <Chip
            label="ACTIVE"
            count={filterCounts.active}
            selected={filter === 'active'}
            accentColor={colors.statusActive}
            onPress={() => {
              haptic.light();
              setFilter('active');
            }}
          />
          <Chip
            label="EXPIRING (7D)"
            count={filterCounts.expiring}
            selected={filter === 'expiring'}
            accentColor={colors.statusExpiring}
            onPress={() => {
              haptic.light();
              setFilter('expiring');
            }}
          />
          <Chip
            label="EXPIRED"
            count={filterCounts.expired}
            selected={filter === 'expired'}
            accentColor={colors.statusExpired}
            onPress={() => {
              haptic.light();
              setFilter('expired');
            }}
          />
        </ScrollView>
      </View>

      {/* List / Skeleton / Empty State */}
      {loading && !refreshing ? (
        <View style={styles.listPadding}>
          <MemberCardSkeleton />
          <MemberCardSkeleton />
          <MemberCardSkeleton />
        </View>
      ) : filteredMembers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={searchQuery ? 'NO MATCHING MEMBERS' : 'NO MEMBERS FOUND'}
          description={
            searchQuery
              ? `No member matched "${searchQuery}". Check the spelling or search by phone.`
              : filter !== 'all'
              ? `No members found in "${filter.toUpperCase()}" status.`
              : 'Add your first gym member to begin tracking workouts and membership dues.'
          }
          actionTitle={
            searchQuery
              ? 'CLEAR SEARCH'
              : filter !== 'all'
              ? 'SHOW ALL MEMBERS'
              : 'ADD FIRST MEMBER'
          }
          onAction={() => {
            if (searchQuery) {
              setSearchQuery('');
            } else if (filter !== 'all') {
              setFilter('all');
            } else {
              navigation.navigate('AddMember', {});
            }
          }}
        />
      ) : (
        <View style={styles.listContainer}>
          <FlashList
            data={filteredMembers}
            renderItem={renderMemberItem}
            keyExtractor={(item) => item.id}
            estimatedItemSize={125}
            contentContainerStyle={styles.listPadding}
            refreshing={refreshing}
            onRefresh={() => fetchMembers(true)}
          />
        </View>
      )}

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => {
          haptic.heavy();
          navigation.navigate('AddMember', {});
        }}
      >
        <Plus size={28} color={colors.black} strokeWidth={2.5} />
      </TouchableOpacity>

      {/* ======================================================== */}
      {/* MEMBER OVERVIEW MODAL / POPUP */}
      {/* ======================================================== */}
      <Modal
        visible={Boolean(selectedMember)}
        transparent
        animationType="slide"
        onRequestClose={handleCloseOverview}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {selectedMember && (
              <>
                {/* Modal Header */}
                <View style={styles.modalHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalMemberName} numberOfLines={1}>
                      {selectedMember.name}
                    </Text>
                    <Text style={styles.modalMemberPhone}>
                      {selectedMember.phone}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={handleCloseOverview}
                    style={styles.modalCloseBtn}
                  >
                    <X size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* Status & Plan Row */}
                <View style={styles.modalPlanCard}>
                  <View style={styles.modalPlanTop}>
                    <View>
                      <Text style={styles.modalPlanLabel}>MEMBERSHIP PLAN</Text>
                      <Text style={styles.modalPlanName}>
                        {selectedMember.planName}
                      </Text>
                    </View>
                    <Text style={styles.modalPlanPrice}>
                      {formatINR(selectedMember.planPrice)}
                    </Text>
                  </View>

                  {/* Dates Row */}
                  <View style={styles.modalDatesRow}>
                    <View>
                      <Text style={styles.modalDateSub}>Start Date</Text>
                      <Text style={styles.modalDateVal}>
                        {formatDate(selectedMember.startDate)}
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.modalDateSub}>Expiry Date</Text>
                      <Text
                        style={[
                          styles.modalDateVal,
                          { color: getStatusColor(selectedMember.status) },
                        ]}
                      >
                        {formatDate(selectedMember.expiryDate)}
                      </Text>
                    </View>
                  </View>

                  {/* Countdown Warning / Info */}
                  <View style={styles.modalCountdownBox}>
                    <Clock
                      size={15}
                      color={getStatusColor(selectedMember.status)}
                    />
                    <Text
                      style={[
                        styles.modalCountdownText,
                        { color: getStatusColor(selectedMember.status) },
                      ]}
                    >
                      {getExpiryCountdownText(selectedMember.expiryDate)}
                    </Text>
                  </View>
                </View>

                {/* Notes if present */}
                {Boolean(selectedMember.notes) && (
                  <View style={styles.modalNotesBox}>
                    <FileText size={14} color={colors.textMuted} />
                    <Text style={styles.modalNotesText}>
                      {selectedMember.notes}
                    </Text>
                  </View>
                )}

                {/* Contact Quick Buttons */}
                <View style={styles.modalContactRow}>
                  <TouchableOpacity
                    style={styles.modalCallBtn}
                    onPress={() => makePhoneCall(selectedMember.phone)}
                    activeOpacity={0.8}
                  >
                    <Phone size={16} color={colors.text} />
                    <Text style={styles.modalCallText}>CALL</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalWhatsAppBtn}
                    onPress={() => handleSendReminder(selectedMember)}
                    activeOpacity={0.8}
                  >
                    <MessageSquare size={16} color={colors.whatsapp} />
                    <Text style={styles.modalWhatsAppText}>WHATSAPP</Text>
                  </TouchableOpacity>
                </View>

                {/* Action Buttons Row */}
                <View style={styles.modalActionButtons}>
                  <Button
                    title="COLLECT FEE / RENEW"
                    variant="primary"
                    icon={<CreditCard size={18} color={colors.black} />}
                    onPress={() => {
                      const m = selectedMember;
                      handleCloseOverview();
                      navigation.navigate('CollectFee', {
                        memberId: m.id,
                        member: m,
                      });
                    }}
                    style={{ marginBottom: spacing.sm }}
                  />

                  <View style={styles.modalSubActionsRow}>
                    <TouchableOpacity
                      style={styles.modalEditBtn}
                      onPress={() => {
                        const m = selectedMember;
                        handleCloseOverview();
                        navigation.navigate('AddMember', { memberId: m.id });
                      }}
                    >
                      <Edit3 size={15} color={colors.primary} />
                      <Text style={styles.modalEditText}>EDIT MEMBER</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.modalFullProfileBtn}
                      onPress={() => {
                        const m = selectedMember;
                        handleCloseOverview();
                        navigation.navigate('MemberDetail', { memberId: m.id });
                      }}
                    >
                      <Text style={styles.modalFullProfileText}>
                        FULL PROFILE & RECEIPTS
                      </Text>
                      <ChevronRight size={15} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  addHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  addHeaderText: {
    fontFamily: fontFamilies.heading,
    fontSize: 13,
    color: colors.black,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  searchSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  searchInputContainer: {
    marginBottom: spacing.xs,
  },
  filterSection: {
    paddingLeft: spacing.lg,
    marginVertical: spacing.sm,
  },
  listContainer: {
    flex: 1,
  },
  listPadding: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: 110, // Space for floating bottom tab bar
  },
  fab: {
    position: 'absolute',
    bottom: 92,
    right: spacing.lg,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    borderTopWidth: 1.5,
    borderColor: colors.borderAccent,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  modalMemberName: {
    fontFamily: fontFamilies.heading,
    fontSize: 22,
    color: colors.text,
    letterSpacing: 0.8,
  },
  modalMemberPhone: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPlanCard: {
    backgroundColor: colors.inputBackground,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalPlanTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  modalPlanLabel: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  modalPlanName: {
    fontFamily: fontFamilies.heading,
    fontSize: 16,
    color: colors.text,
  },
  modalPlanPrice: {
    fontFamily: fontFamilies.heading,
    fontSize: 20,
    color: colors.primary,
  },
  modalDatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  modalDateSub: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 11,
    color: colors.textMuted,
  },
  modalDateVal: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 13,
    color: colors.text,
    marginTop: 1,
  },
  modalCountdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
  },
  modalCountdownText: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 12,
    marginLeft: 6,
  },
  modalNotesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    padding: spacing.sm,
    borderRadius: radius.card,
    marginBottom: spacing.md,
  },
  modalNotesText: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 6,
    flex: 1,
  },
  modalContactRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  modalCallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    backgroundColor: colors.inputBackground,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCallText: {
    fontFamily: fontFamilies.heading,
    fontSize: 12,
    color: colors.text,
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  modalWhatsAppBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    backgroundColor: colors.inputBackground,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: `${colors.whatsapp}40`,
  },
  modalWhatsAppText: {
    fontFamily: fontFamilies.heading,
    fontSize: 12,
    color: colors.whatsapp,
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  modalActionButtons: {
    marginTop: spacing.xs,
  },
  modalSubActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
  },
  modalEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  modalEditText: {
    fontFamily: fontFamilies.heading,
    fontSize: 12,
    color: colors.primary,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  modalFullProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  modalFullProfileText: {
    fontFamily: fontFamilies.heading,
    fontSize: 12,
    color: colors.textSecondary,
    marginRight: 2,
    letterSpacing: 0.5,
  },
});
