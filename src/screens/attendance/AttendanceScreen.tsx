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
  ChevronLeft,
  ChevronRight,
  Search,
  Check,
  CalendarCheck,
  X,
  CreditCard,
} from 'lucide-react-native';
import { addDays, subDays, isToday, format } from 'date-fns';
import { colors, fontFamilies, radius, spacing } from '../../theme';
import { RootStackParamList } from '../../app/navigation/types';
import { Member, AttendanceEntry } from '../../types/models';
import { getMembersPaginated } from '../../services/members';
import {
  toggleAttendanceWithStats,
  subscribeToAttendance,
} from '../../services/attendance';
import { getTodayDateKey, formatDate } from '../../utils/dates';
import { getExpiryCountdownText } from '../../utils/memberStatus';
import { Input } from '../../components/Input';
import { Card } from '../../components/Card';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { EmptyState } from '../../components/EmptyState';
import { useGymStore } from '../../store/useGymStore';
import { useAccessGuard } from '../../hooks/useAccessGuard';
import { useDebounce } from '../../hooks/useDebounce';
import { haptic } from '../../utils/haptics';

type AttendanceNavProp = NativeStackNavigationProp<RootStackParamList>;

export const AttendanceScreen: React.FC = () => {
  useAccessGuard();
  const navigation = useNavigation<AttendanceNavProp>();
  const { gym, statsSummary, loadGymData } = useGymStore();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [members, setMembers] = useState<Member[]>([]);
  const [attendanceEntries, setAttendanceEntries] = useState<
    Record<string, AttendanceEntry>
  >({});
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Expired check-in interception modal state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [pendingMember, setPendingMember] = useState<Member | null>(null);

  const dateKey = getTodayDateKey(selectedDate);
  const isDateToday = isToday(selectedDate);
  const dateTitle = isDateToday
    ? `TODAY, ${format(selectedDate, 'dd MMM yyyy').toUpperCase()}`
    : format(selectedDate, 'EEEE, dd MMM yyyy').toUpperCase();

  // Load all gym members
  useEffect(() => {
    if (!gym?.ownerUid) return;
    getMembersPaginated(gym.ownerUid, 'all', null, 100).then((res) => {
      setMembers(res.members);
    });
  }, [gym?.ownerUid]);

  // Real-time listener for attendance entries on the selected date
  useEffect(() => {
    if (!gym?.ownerUid) return;

    const unsubscribe = subscribeToAttendance(gym.ownerUid, dateKey, (entries) => {
      setAttendanceEntries(entries);
    });

    return () => unsubscribe();
  }, [gym?.ownerUid, dateKey]);

  const presentCount = Object.keys(attendanceEntries).length;
  const totalCount = members.length;

  const handlePrevDay = () => {
    haptic.light();
    setSelectedDate((prev) => subDays(prev, 1));
  };

  const handleNextDay = () => {
    haptic.light();
    setSelectedDate((prev) => addDays(prev, 1));
  };

  const performCheckIn = async (member: Member, present: boolean) => {
    if (!gym?.ownerUid) return;
    try {
      await toggleAttendanceWithStats(
        gym.ownerUid,
        dateKey,
        member.id,
        member.name,
        present
      );
      if (present) {
        haptic.success();
      } else {
        haptic.light();
      }
    } catch (e) {
      console.warn('[AttendanceScreen] Error toggling attendance:', e);
    }
  };

  const handleToggle = (member: Member) => {
    const isPresent = Boolean(attendanceEntries[member.id]?.present);

    if (isPresent) {
      // Toggle off
      performCheckIn(member, false);
      return;
    }

    // Checking in: check if member is expired
    if (member.status === 'expired') {
      haptic.warning();
      setPendingMember(member);
      setDialogVisible(true);
      return;
    }

    performCheckIn(member, true);
  };

  const filteredMembers = members.filter((m) => {
    if (!debouncedSearch.trim()) return true;
    const q = debouncedSearch.toLowerCase().trim();
    return m.name.toLowerCase().includes(q) || m.phone.includes(q);
  });

  const renderAttendanceRow = useCallback(
    ({ item }: { item: Member }) => {
      const isPresent = Boolean(attendanceEntries[item.id]?.present);

      return (
        <View style={[styles.memberRow, isPresent && styles.presentRow]}>
          <View style={styles.memberInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text numberOfLines={1} style={styles.memberName}>
                {item.name}
              </Text>
              {item.status === 'expired' && (
                <View style={styles.expiredBadge}>
                  <Text style={styles.expiredBadgeText}>EXPIRED</Text>
                </View>
              )}
            </View>
            <Text style={styles.memberPlanSub}>
              {item.planName} • {item.phone}
            </Text>
          </View>

          {/* Big Check-in Toggle Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleToggle(item)}
            style={[
              styles.checkInToggleBtn,
              isPresent && styles.checkInToggleBtnActive,
            ]}
          >
            {isPresent ? (
              <View style={styles.toggleContent}>
                <Check size={18} color={colors.black} strokeWidth={3} />
                <Text style={styles.toggleActiveText}>IN</Text>
              </View>
            ) : (
              <Text style={styles.toggleInactiveText}>CHECK IN</Text>
            )}
          </TouchableOpacity>
        </View>
      );
    },
    [attendanceEntries]
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>ATTENDANCE</Text>
        <Text style={styles.subtitle}>DAILY MEMBER CHECK-INS</Text>
      </View>

      {/* Date Switcher Bar */}
      <View style={styles.dateSwitcherWrapper}>
        <Card style={styles.dateSwitcherCard}>
          <TouchableOpacity onPress={handlePrevDay} style={styles.dateArrowBtn}>
            <ChevronLeft size={20} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.dateTitle}>{dateTitle}</Text>

          <TouchableOpacity onPress={handleNextDay} style={styles.dateArrowBtn}>
            <ChevronRight size={20} color={colors.text} />
          </TouchableOpacity>
        </Card>
      </View>

      {/* Present Count Banner */}
      <View style={styles.countBanner}>
        <CalendarCheck size={20} color={colors.primary} />
        <Text style={styles.countBannerText}>
          <Text style={styles.countHighlight}>{presentCount}</Text> / {totalCount} MEMBERS PRESENT
        </Text>
      </View>

      {/* Search Filter */}
      <View style={styles.searchSection}>
        <Input
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search member by name or mobile..."
          prefix={<Search size={18} color={colors.textMuted} />}
          suffix={
            searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color={colors.textMuted} />
              </TouchableOpacity>
            ) : undefined
          }
          containerStyle={styles.searchInput}
        />
      </View>

      {/* Member FlashList */}
      {filteredMembers.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title={searchQuery ? 'NO MEMBERS MATCH' : 'NO MEMBERS IN GYM'}
          description={
            searchQuery
              ? `No member matched "${searchQuery}".`
              : 'Add members to start logging attendance.'
          }
        />
      ) : (
        <View style={styles.listContainer}>
          <FlashList
            data={filteredMembers}
            renderItem={renderAttendanceRow}
            keyExtractor={(item) => item.id}
            estimatedItemSize={72}
            contentContainerStyle={styles.listPadding}
          />
        </View>
      )}

      {/* Dialog when checking in an EXPIRED member */}
      {pendingMember && (
        <ConfirmDialog
          visible={dialogVisible}
          title="PLAN EXPIRED"
          message={`${pendingMember.name}'s membership ${getExpiryCountdownText(
            pendingMember.expiryDate
          ).toLowerCase()}. Would you like to collect their fee now?`}
          confirmTitle="COLLECT FEE"
          onConfirm={() => {
            setDialogVisible(false);
            navigation.navigate('CollectFee', {
              memberId: pendingMember.id,
              member: pendingMember,
            });
          }}
          secondaryTitle="MARK PRESENT ANYWAY"
          onSecondary={() => {
            setDialogVisible(false);
            performCheckIn(pendingMember, true);
          }}
          onCancel={() => setDialogVisible(false)}
        />
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
  dateSwitcherWrapper: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
  },
  dateSwitcherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  dateArrowBtn: {
    padding: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.inputBackground,
  },
  dateTitle: {
    fontFamily: fontFamilies.heading,
    fontSize: 15,
    color: colors.text,
    letterSpacing: 0.8,
  },
  countBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderAccent,
  },
  countBannerText: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    letterSpacing: 0.5,
  },
  countHighlight: {
    color: colors.primary,
    fontSize: 16,
  },
  searchSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  searchInput: {
    marginBottom: spacing.xs,
  },
  listContainer: {
    flex: 1,
  },
  listPadding: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: 100,
  },
  memberRow: {
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
  presentRow: {
    borderColor: colors.primary,
    backgroundColor: '#15151BE0',
  },
  memberInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  memberName: {
    fontFamily: fontFamilies.heading,
    fontSize: 18,
    color: colors.text,
    letterSpacing: 0.5,
  },
  expiredBadge: {
    backgroundColor: `${colors.danger}20`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.danger,
    marginLeft: spacing.xs,
  },
  expiredBadgeText: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 9,
    color: colors.danger,
  },
  memberPlanSub: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  checkInToggleBtn: {
    height: 40,
    minWidth: 90,
    borderRadius: radius.pill,
    backgroundColor: colors.inputBackground,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  checkInToggleBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleActiveText: {
    fontFamily: fontFamilies.heading,
    fontSize: 14,
    color: colors.black,
    marginLeft: 3,
    letterSpacing: 0.5,
  },
  toggleInactiveText: {
    fontFamily: fontFamilies.heading,
    fontSize: 13,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
});
