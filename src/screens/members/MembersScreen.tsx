import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Search, Plus, X, Users } from 'lucide-react-native';
import { colors, fontFamilies, radius, spacing } from '../../theme';
import { RootStackParamList } from '../../app/navigation/types';
import { Member, MemberStatus } from '../../types/models';
import { getMembersPaginated } from '../../services/members';
import { MemberCard } from '../../components/MemberCard';
import { Chip } from '../../components/Chip';
import { Input } from '../../components/Input';
import { MemberCardSkeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { useGymStore } from '../../store/useGymStore';
import { useDebounce } from '../../hooks/useDebounce';
import { useAccessGuard } from '../../hooks/useAccessGuard';
import { haptic } from '../../utils/haptics';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

type MembersNavProp = NativeStackNavigationProp<RootStackParamList>;

export const MembersScreen: React.FC = () => {
  useAccessGuard();
  const navigation = useNavigation<MembersNavProp>();
  const { gym, statsSummary } = useGymStore();

  const [filter, setFilter] = useState<'all' | MemberStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [members, setMembers] = useState<Member[]>([]);
  const [lastDoc, setLastDoc] = useState<FirebaseFirestoreTypes.QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchMembers = async (isRefresh: boolean = false) => {
    if (!gym?.ownerUid) return;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const result = await getMembersPaginated(gym.ownerUid, filter, null);
      setMembers(result.members);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (error) {
      console.warn('[MembersScreen] Error loading members:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLoadMore = async () => {
    if (!gym?.ownerUid || loadingMore || !hasMore || !lastDoc) return;
    setLoadingMore(true);
    try {
      const result = await getMembersPaginated(gym.ownerUid, filter, lastDoc);
      setMembers((prev) => [...prev, ...result.members]);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (error) {
      console.warn('[MembersScreen] Error loading more members:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [gym?.ownerUid, filter]);

  // Client-side instant filter on debounced search
  const filteredMembers = members.filter((m) => {
    if (!debouncedSearch.trim()) return true;
    const query = debouncedSearch.toLowerCase().trim();
    return (
      m.name.toLowerCase().includes(query) ||
      m.phone.includes(query) ||
      m.planName.toLowerCase().includes(query)
    );
  });

  const renderMemberItem = useCallback(
    ({ item }: { item: Member }) => (
      <MemberCard
        member={item}
        onPress={() => navigation.navigate('MemberDetail', { memberId: item.id })}
        onCollectFee={() =>
          navigation.navigate('CollectFee', { memberId: item.id, member: item })
        }
      />
    ),
    [navigation]
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>MEMBERS</Text>
          <Text style={styles.subtitle}>
            {statsSummary?.totalMembers || 0} TOTAL ADMISSIONS
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

      {/* Filter Chips */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Chip
            label="ALL"
            count={statsSummary?.totalMembers}
            selected={filter === 'all'}
            onPress={() => setFilter('all')}
          />
          <Chip
            label="ACTIVE"
            count={statsSummary?.activeMembers}
            selected={filter === 'active'}
            accentColor={colors.statusActive}
            onPress={() => setFilter('active')}
          />
          <Chip
            label="EXPIRING (7D)"
            count={statsSummary?.expiringCount}
            selected={filter === 'expiring'}
            accentColor={colors.statusExpiring}
            onPress={() => setFilter('expiring')}
          />
          <Chip
            label="EXPIRED"
            count={statsSummary?.expiredCount}
            selected={filter === 'expired'}
            accentColor={colors.statusExpired}
            onPress={() => setFilter('expired')}
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
              : 'Add your first gym member to begin tracking workouts and membership dues.'
          }
          actionTitle={searchQuery ? 'CLEAR SEARCH' : 'ADD FIRST MEMBER'}
          onAction={() => {
            if (searchQuery) {
              setSearchQuery('');
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
            estimatedItemSize={118}
            contentContainerStyle={styles.listPadding}
            refreshing={refreshing}
            onRefresh={() => fetchMembers(true)}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.4}
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
    paddingBottom: 100, // Space for floating bottom tab bar
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
});
