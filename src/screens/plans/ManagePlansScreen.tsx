import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Plus, Edit2, Trash2, CheckCircle2, X } from 'lucide-react-native';
import { colors, fontFamilies, radius, spacing, shadows } from '../../theme';
import { RootStackParamList } from '../../app/navigation/types';
import { MembershipPlan } from '../../types/models';
import {
  getGymPlans,
  addGymPlan,
  updateGymPlan,
  deleteGymPlan,
} from '../../services/plans';
import { formatINR } from '../../utils/money';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useGymStore } from '../../store/useGymStore';
import { haptic } from '../../utils/haptics';

type ManagePlansNavProp = NativeStackNavigationProp<RootStackParamList, 'ManagePlans'>;

export const ManagePlansScreen: React.FC = () => {
  const navigation = useNavigation<ManagePlansNavProp>();
  const { gym, plans, setPlans } = useGymStore();

  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);

  const [planName, setPlanName] = useState('');
  const [durationDays, setDurationDays] = useState('30');
  const [price, setPrice] = useState('1000');

  const fetchPlans = async () => {
    if (!gym?.ownerUid) return;
    setLoading(true);
    try {
      const data = await getGymPlans(gym.ownerUid);
      setPlans(data);
    } catch (e) {
      console.warn('[ManagePlans] Error fetching plans:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [gym?.ownerUid]);

  const openAddModal = () => {
    haptic.light();
    setEditingPlan(null);
    setPlanName('');
    setDurationDays('30');
    setPrice('1000');
    setModalVisible(true);
  };

  const openEditModal = (plan: MembershipPlan) => {
    haptic.light();
    setEditingPlan(plan);
    setPlanName(plan.name);
    setDurationDays(String(plan.durationDays));
    setPrice(String(plan.price));
    setModalVisible(true);
  };

  const handleSavePlan = async () => {
    if (!gym?.ownerUid) return;
    if (!planName.trim()) {
      Alert.alert('Required', 'Please enter a plan name.');
      return;
    }

    const days = parseInt(durationDays.replace(/\D/g, ''), 10) || 30;
    const planPrice = parseInt(price.replace(/\D/g, ''), 10) || 0;

    setLoading(true);
    try {
      if (editingPlan) {
        await updateGymPlan(gym.ownerUid, editingPlan.id, {
          name: planName.trim(),
          durationDays: days,
          price: planPrice,
        });
        haptic.success();
      } else {
        await addGymPlan(gym.ownerUid, {
          name: planName.trim(),
          durationDays: days,
          price: planPrice,
          isActive: true,
        });
        haptic.success();
      }
      setModalVisible(false);
      await fetchPlans();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to save plan.');
      haptic.error();
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = (plan: MembershipPlan) => {
    if (!gym?.ownerUid) return;

    Alert.alert(
      'Delete Plan?',
      `Are you sure you want to delete "${plan.name}"? If members are actively assigned, deletion will be prevented.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await deleteGymPlan(gym.ownerUid, plan.id);
              haptic.success();
              await fetchPlans();
            } catch (err: any) {
              Alert.alert('Cannot Delete', err?.message || 'Plan is in use.');
              haptic.error();
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>MANAGE PLANS</Text>

        <TouchableOpacity onPress={openAddModal} style={styles.addButton}>
          <Plus size={20} color={colors.black} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtext}>
          Create and configure membership tiers. Price updates apply only to new renewals.
        </Text>

        {plans.map((p) => (
          <Card key={p.id} style={styles.planCard}>
            <View style={styles.planRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.planName}>{p.name}</Text>
                <Text style={styles.planDetails}>
                  {p.durationDays} Days Duration • {formatINR(p.price)}
                </Text>
              </View>

              <View style={styles.planActions}>
                <TouchableOpacity
                  onPress={() => openEditModal(p)}
                  style={styles.iconBtn}
                >
                  <Edit2 size={16} color={colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleDeletePlan(p)}
                  style={[styles.iconBtn, styles.deleteBtn]}
                >
                  <Trash2 size={16} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        ))}
      </ScrollView>

      {/* Add / Edit Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingPlan ? 'EDIT PLAN' : 'NEW MEMBERSHIP PLAN'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Input
              label="PLAN NAME"
              value={planName}
              onChangeText={setPlanName}
              placeholder="e.g. 6 Months Strength"
            />

            <View style={styles.modalRow}>
              <View style={{ flex: 1, marginRight: spacing.sm }}>
                <Input
                  label="DURATION (DAYS)"
                  value={durationDays}
                  onChangeText={setDurationDays}
                  keyboardType="number-pad"
                  placeholder="30"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="PRICE (₹)"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="number-pad"
                  placeholder="1500"
                />
              </View>
            </View>

            <Button
              title={editingPlan ? 'UPDATE PLAN' : 'CREATE PLAN'}
              onPress={handleSavePlan}
              loading={loading}
              variant="primary"
              style={{ marginTop: spacing.md }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.glassPill,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopColor: colors.glassBorderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: fontFamilies.heading,
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  subtext: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  planCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopColor: colors.glassBorderLight,
    ...shadows.card,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planName: {
    fontFamily: fontFamilies.heading,
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.2,
  },
  planDetails: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  planActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.glassPill,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopColor: colors.glassBorderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    borderColor: `${colors.danger}40`,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.backdrop,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.elevated,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopColor: colors.glassHighlight,
    ...shadows.cardElevated,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontFamily: fontFamilies.heading,
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  modalRow: {
    flexDirection: 'row',
  },
});
