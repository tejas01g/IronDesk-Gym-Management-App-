import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  Trash2,
  Calendar,
  Check,
  Plus,
  Edit2,
  X,
  CreditCard,
  Clock,
  Sparkles,
} from 'lucide-react-native';
import firestore from '@react-native-firebase/firestore';
import { colors, fontFamilies, radius, spacing } from '../../theme';
import { RootStackParamList } from '../../app/navigation/types';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { MembershipPlan, PaymentMode, Member } from '../../types/models';
import {
  addMemberWithStats,
  checkPhoneExists,
  getMemberById,
  updateMember,
  deleteMemberWithStats,
} from '../../services/members';
import { addGymPlan, getGymPlans } from '../../services/plans';
import { isValidIndianPhone, isValidName } from '../../utils/validators';
import { formatDate, addDaysToDate, toJsDate } from '../../utils/dates';
import { calculateMemberStatus } from '../../utils/memberStatus';
import { formatINR } from '../../utils/money';
import { useGymStore } from '../../store/useGymStore';
import { haptic } from '../../utils/haptics';

type AddMemberNavProp = NativeStackNavigationProp<RootStackParamList, 'AddMember'>;
type AddMemberRouteProp = RouteProp<RootStackParamList, 'AddMember'>;

const MONTH_PRESETS = [
  { label: '1 Month', months: 1, days: 30, defaultPrice: 1000 },
  { label: '2 Months', months: 2, days: 60, defaultPrice: 1900 },
  { label: '3 Months', months: 3, days: 90, defaultPrice: 2700 },
  { label: '6 Months', months: 6, days: 180, defaultPrice: 5000 },
  { label: '12 Months', months: 12, days: 365, defaultPrice: 9000 },
];

export const AddMemberScreen: React.FC = () => {
  const navigation = useNavigation<AddMemberNavProp>();
  const route = useRoute<AddMemberRouteProp>();
  const { gym, plans, setPlans, loadGymData } = useGymStore();

  const memberId = route.params?.memberId;
  const isEditMode = Boolean(memberId);

  const [existingMember, setExistingMember] = useState<Member | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(
    plans[0] || null
  );

  // Editable Plan Fields
  const [planName, setPlanName] = useState(plans[0]?.name || '1 Month General');
  const [planPrice, setPlanPrice] = useState(String(plans[0]?.price || 1000));
  const [durationDays, setDurationDays] = useState(
    String(plans[0]?.durationDays || 30)
  );
  const [isEditingPlanDetails, setIsEditingPlanDetails] = useState(false);

  // Modal to Add Multiple Monthly Plans
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [newPlanName, setNewPlanName] = useState('1 Month Plan');
  const [newPlanMonths, setNewPlanMonths] = useState(1);
  const [newPlanDays, setNewPlanDays] = useState('30');
  const [newPlanPrice, setNewPlanPrice] = useState('1000');
  const [isSavingPlan, setIsSavingPlan] = useState(false);

  const [startDate, setStartDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');
  const [feeReceivedNow, setFeeReceivedNow] = useState<boolean>(true);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);

  // Load member if editing
  useEffect(() => {
    if (isEditMode && gym?.ownerUid && memberId) {
      getMemberById(gym.ownerUid, memberId)
        .then((m) => {
          if (m) {
            setExistingMember(m);
            setName(m.name);
            setPhone(m.phone);
            setNotes(m.notes || '');
            setPlanName(m.planName || 'Custom Plan');
            setPlanPrice(String(m.planPrice || 1000));
            setStartDate(toJsDate(m.startDate));

            const matchingPlan = plans.find((p) => p.id === m.planId);
            if (matchingPlan) {
              setSelectedPlan(matchingPlan);
              setDurationDays(String(matchingPlan.durationDays));
            } else {
              setDurationDays('30');
            }
          }
        })
        .finally(() => setInitialLoading(false));
    }
  }, [isEditMode, memberId, gym?.ownerUid]);

  // When selected plan changes, update editable fields
  const handleSelectPlan = (plan: MembershipPlan) => {
    setSelectedPlan(plan);
    setPlanName(plan.name);
    setPlanPrice(String(plan.price));
    setDurationDays(String(plan.durationDays));
  };

  // Expiry calculation based on editable durationDays
  const numericDuration = parseInt(durationDays.replace(/\D/g, ''), 10) || 30;
  const calculatedExpiry = addDaysToDate(startDate, numericDuration);

  // Quick Preset Selection in Add Plan Modal
  const handleSelectPreset = (preset: typeof MONTH_PRESETS[0]) => {
    setNewPlanName(`${preset.label} Plan`);
    setNewPlanMonths(preset.months);
    setNewPlanDays(String(preset.days));
    setNewPlanPrice(String(preset.defaultPrice));
  };

  // Save new plan directly to gym's plans
  const handleCreateNewPlan = async () => {
    if (!gym?.ownerUid) return;
    if (!newPlanName.trim()) {
      Alert.alert('Required', 'Please enter a name for the plan.');
      return;
    }

    const priceNum = parseInt(newPlanPrice.replace(/\D/g, ''), 10) || 0;
    const daysNum = parseInt(newPlanDays.replace(/\D/g, ''), 10) || 30;

    setIsSavingPlan(true);
    try {
      const createdPlan = await addGymPlan(gym.ownerUid, {
        name: newPlanName.trim(),
        durationDays: daysNum,
        price: priceNum,
        isActive: true,
      });

      // Update plans list in store
      const updatedPlans = await getGymPlans(gym.ownerUid);
      setPlans(updatedPlans);

      // Select newly created plan
      handleSelectPlan(createdPlan);
      setShowAddPlanModal(false);
      haptic.success();
    } catch (err: any) {
      console.warn('[AddMemberScreen] Error creating plan:', err);
      Alert.alert('Error', err?.message || 'Failed to save new plan.');
    } finally {
      setIsSavingPlan(false);
    }
  };

  const validate = async (): Promise<boolean> => {
    const errs: Record<string, string> = {};

    if (!isValidName(name)) {
      errs.name = 'Please enter a valid member name (min 2 letters)';
    }

    if (!isValidIndianPhone(phone)) {
      errs.phone = 'Enter a valid 10-digit Indian mobile number';
    } else if (gym?.ownerUid) {
      const exists = await checkPhoneExists(gym.ownerUid, phone, memberId);
      if (exists) {
        errs.phone = 'A member with this mobile number already exists';
      }
    }

    if (!planName.trim()) {
      errs.plan = 'Please enter or select a membership plan';
    }

    const priceNum = parseInt(planPrice.replace(/\D/g, ''), 10);
    if (isNaN(priceNum) || priceNum < 0) {
      errs.price = 'Please enter a valid plan price';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!gym?.ownerUid) return;

    setLoading(true);
    const isValid = await validate();
    if (!isValid) {
      haptic.error();
      setLoading(false);
      return;
    }

    const finalPrice = parseInt(planPrice.replace(/\D/g, ''), 10) || 1000;
    const finalDays = parseInt(durationDays.replace(/\D/g, ''), 10) || 30;
    const finalPlanName = planName.trim() || 'General Plan';
    const finalPlanId = selectedPlan?.id || 'custom-plan';

    try {
      if (isEditMode && memberId) {
        const newExpiry = addDaysToDate(startDate, finalDays);
        const newStatus = calculateMemberStatus(newExpiry);

        await updateMember(gym.ownerUid, memberId, {
          name: name.trim(),
          phone: phone.trim(),
          notes: notes.trim(),
          planId: finalPlanId,
          planName: finalPlanName,
          planPrice: finalPrice,
          durationDays: finalDays,
          expiryDate: firestore.Timestamp.fromDate(newExpiry),
          status: newStatus,
        });

        await loadGymData(gym.ownerUid);
        haptic.success();
        Alert.alert('Success', 'Member details & plan updated successfully.');
        navigation.goBack();
      } else {
        await addMemberWithStats(gym.ownerUid, {
          name: name.trim(),
          phone: phone.trim(),
          planId: finalPlanId,
          planName: finalPlanName,
          planPrice: finalPrice,
          startDate,
          durationDays: finalDays,
          notes: notes.trim(),
          feeReceivedNow,
          paymentMode: feeReceivedNow ? paymentMode : undefined,
        });

        await loadGymData(gym.ownerUid);
        haptic.success();
        navigation.goBack();
      }
    } catch (error: any) {
      console.warn('[AddMemberScreen] Save error:', error);
      Alert.alert('Save Failed', error?.message || 'Could not save member details.');
      haptic.error();
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = () => {
    if (!existingMember || !gym?.ownerUid) return;

    Alert.alert(
      'Delete Member?',
      `Are you sure you want to permanently delete "${existingMember.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await deleteMemberWithStats(gym.ownerUid, existingMember);
              await loadGymData(gym.ownerUid);
              haptic.success();
              navigation.navigate('Main', { screen: 'MembersTab' });
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete member.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (initialLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <Text style={styles.loadingText}>LOADING MEMBER...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            {isEditMode ? 'EDIT MEMBER' : 'ADD NEW MEMBER'}
          </Text>

          {isEditMode ? (
            <TouchableOpacity
              onPress={handleDeleteMember}
              style={styles.deleteHeaderButton}
            >
              <Trash2 size={20} color={colors.danger} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 44 }} />
          )}
        </View>

        {/* Member Details Card */}
        <Card style={styles.formCard}>
          <Text style={styles.cardHeading}>PERSONAL INFORMATION</Text>

          <Input
            label="FULL NAME *"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
            }}
            placeholder="e.g. Rahul Sharma"
            error={errors.name}
          />

          <Input
            label="PHONE NUMBER *"
            value={phone}
            onChangeText={(text) => {
              setPhone(text.replace(/\D/g, '').slice(0, 10));
              if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
            }}
            placeholder="98765 43210"
            keyboardType="number-pad"
            maxLength={10}
            prefix={<Text style={styles.prefixText}>+91</Text>}
            error={errors.phone}
          />
        </Card>

        {/* ======================================================== */}
        {/* MEMBERSHIP PLAN SELECTION & EDITABLE CUSTOMIZATION */}
        {/* ======================================================== */}
        <Card style={styles.formCard}>
          <View style={styles.cardHeaderFlex}>
            <Text style={styles.cardHeading}>MEMBERSHIP PLAN</Text>
            <TouchableOpacity
              onPress={() => {
                haptic.light();
                setShowAddPlanModal(true);
              }}
              style={styles.addPlanHeaderBtn}
              activeOpacity={0.8}
            >
              <Plus size={14} color={colors.black} />
              <Text style={styles.addPlanBtnText}>+ ADD PLAN</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Plan Badges / Options */}
          <Text style={styles.sectionSubLabel}>CHOOSE FROM GYM PLANS:</Text>
          <View style={styles.plansContainer}>
            {plans.map((plan) => {
              const isSelected = selectedPlan?.id === plan.id;
              return (
                <TouchableOpacity
                  key={plan.id}
                  onPress={() => {
                    haptic.light();
                    handleSelectPlan(plan);
                  }}
                  style={[
                    styles.planOption,
                    isSelected && styles.selectedPlanOption,
                  ]}
                  activeOpacity={0.8}
                >
                  <View style={styles.planInfoRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View
                        style={[
                          styles.planRadioDot,
                          isSelected && styles.selectedPlanRadioDot,
                        ]}
                      >
                        {isSelected && <View style={styles.planRadioInner} />}
                      </View>
                      <Text
                        style={[
                          styles.planNameText,
                          isSelected && styles.selectedPlanNameText,
                        ]}
                      >
                        {plan.name}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.planPriceText,
                        isSelected && styles.selectedPlanPriceText,
                      ]}
                    >
                      {formatINR(plan.price)}
                    </Text>
                  </View>
                  <Text style={styles.planDaysText}>
                    {plan.durationDays} Days Duration
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Plan Customization / Editable Inputs */}
          <View style={styles.editablePlanBox}>
            <View style={styles.editablePlanTitleRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Edit2 size={15} color={colors.primary} />
                <Text style={styles.editablePlanTitle}>
                  CUSTOMIZE PLAN & PRICE FOR MEMBER
                </Text>
              </View>
            </View>

            <Input
              label="PLAN NAME *"
              value={planName}
              onChangeText={setPlanName}
              placeholder="e.g. 1 Month General"
              error={errors.plan}
            />

            <View style={styles.twoColRow}>
              <View style={{ flex: 1, marginRight: spacing.sm }}>
                <Input
                  label="PRICE (₹) *"
                  value={planPrice}
                  onChangeText={(val) => setPlanPrice(val.replace(/\D/g, ''))}
                  placeholder="1000"
                  keyboardType="number-pad"
                  prefix={<Text style={styles.prefixText}>₹</Text>}
                  error={errors.price}
                />
              </View>

              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Input
                  label="DURATION (DAYS) *"
                  value={durationDays}
                  onChangeText={(val) => setDurationDays(val.replace(/\D/g, ''))}
                  placeholder="30"
                  keyboardType="number-pad"
                  suffix={<Text style={styles.suffixText}>Days</Text>}
                />
              </View>
            </View>

            {/* Quick Duration Buttons */}
            <View style={styles.durationPillsRow}>
              {[
                { label: '1 Mo (30d)', days: 30 },
                { label: '2 Mo (60d)', days: 60 },
                { label: '3 Mo (90d)', days: 90 },
                { label: '6 Mo (180d)', days: 180 },
                { label: '1 Yr (365d)', days: 365 },
              ].map((p) => {
                const isActive = numericDuration === p.days;
                return (
                  <TouchableOpacity
                    key={p.days}
                    onPress={() => {
                      haptic.light();
                      setDurationDays(String(p.days));
                    }}
                    style={[
                      styles.durationPill,
                      isActive && styles.activeDurationPill,
                    ]}
                  >
                    <Text
                      style={[
                        styles.durationPillText,
                        isActive && styles.activeDurationPillText,
                      ]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Calculated Expiry Card */}
          <View style={styles.expiryDisplayCard}>
            <Calendar size={18} color={colors.primary} />
            <View style={styles.expiryInfoBlock}>
              <Text style={styles.expirySubText}>Calculated Membership Expiry:</Text>
              <Text style={styles.expiryBoldDate}>{formatDate(calculatedExpiry)}</Text>
            </View>
          </View>
        </Card>

        {/* Fee Collection Prompt (Only for new members) */}
        {!isEditMode && (
          <Card style={styles.formCard}>
            <Text style={styles.cardHeading}>FEE COLLECTION</Text>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Fee received now?</Text>
              <View style={styles.toggleGroup}>
                <TouchableOpacity
                  style={[
                    styles.toggleOption,
                    feeReceivedNow && styles.activeToggle,
                  ]}
                  onPress={() => setFeeReceivedNow(true)}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      feeReceivedNow && styles.activeToggleText,
                    ]}
                  >
                    YES
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.toggleOption,
                    !feeReceivedNow && styles.activeToggle,
                  ]}
                  onPress={() => setFeeReceivedNow(false)}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      !feeReceivedNow && styles.activeToggleText,
                    ]}
                  >
                    PENDING
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* If fee received now, select Cash vs UPI */}
            {feeReceivedNow && (
              <View style={styles.paymentModeSection}>
                <Text style={styles.paymentModeLabel}>PAYMENT METHOD:</Text>
                <View style={styles.modeButtonsRow}>
                  <TouchableOpacity
                    style={[
                      styles.modeButton,
                      paymentMode === 'cash' && styles.activeModeButton,
                    ]}
                    onPress={() => setPaymentMode('cash')}
                  >
                    <Text
                      style={[
                        styles.modeText,
                        paymentMode === 'cash' && styles.activeModeText,
                      ]}
                    >
                      💵 CASH
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modeButton,
                      paymentMode === 'upi' && styles.activeModeButton,
                    ]}
                    onPress={() => setPaymentMode('upi')}
                  >
                    <Text
                      style={[
                        styles.modeText,
                        paymentMode === 'upi' && styles.activeModeText,
                      ]}
                    >
                      📱 ONLINE / UPI
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Card>
        )}

        {/* Notes */}
        <Card style={styles.formCard}>
          <Input
            label="ADDITIONAL NOTES (OPTIONAL)"
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g. Locker #14, Morning batch, Blood group O+"
            multiline
            numberOfLines={3}
            inputStyle={{ height: 80, textAlignVertical: 'top' }}
          />
        </Card>

        {/* Action Button */}
        <Button
          title={isEditMode ? 'UPDATE MEMBER' : 'SAVE & ADMIT MEMBER'}
          onPress={handleSave}
          loading={loading}
          variant="primary"
          style={styles.submitButton}
        />
      </ScrollView>

      {/* ======================================================== */}
      {/* QUICK MODAL: ADD MULTIPLE MONTHLY PLANS WITH PRICE */}
      {/* ======================================================== */}
      <Modal
        visible={showAddPlanModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddPlanModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>ADD NEW MEMBERSHIP PLAN</Text>
                <Text style={styles.modalSubtitle}>
                  Create multiple monthly plans with custom price
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAddPlanModal(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Quick Month Presets */}
            <Text style={styles.presetLabel}>QUICK SELECT PRESET:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
              {MONTH_PRESETS.map((preset) => {
                const isSelected = newPlanMonths === preset.months;
                return (
                  <TouchableOpacity
                    key={preset.months}
                    onPress={() => handleSelectPreset(preset)}
                    style={[
                      styles.presetBadge,
                      isSelected && styles.activePresetBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.presetBadgeText,
                        isSelected && styles.activePresetBadgeText,
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Input
              label="PLAN NAME *"
              value={newPlanName}
              onChangeText={setNewPlanName}
              placeholder="e.g. 3 Months Fitness"
            />

            <View style={styles.twoColRow}>
              <View style={{ flex: 1, marginRight: spacing.sm }}>
                <Input
                  label="PRICE (₹) *"
                  value={newPlanPrice}
                  onChangeText={(val) => setNewPlanPrice(val.replace(/\D/g, ''))}
                  placeholder="2500"
                  keyboardType="number-pad"
                  prefix={<Text style={styles.prefixText}>₹</Text>}
                />
              </View>

              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Input
                  label="DURATION (DAYS) *"
                  value={newPlanDays}
                  onChangeText={(val) => setNewPlanDays(val.replace(/\D/g, ''))}
                  placeholder="90"
                  keyboardType="number-pad"
                  suffix={<Text style={styles.suffixText}>Days</Text>}
                />
              </View>
            </View>

            <Button
              title="SAVE PLAN & SELECT"
              onPress={handleCreateNewPlan}
              loading={isSavingPlan}
              variant="primary"
              style={{ marginTop: spacing.md }}
            />
          </View>
        </View>
      </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardContainer: {
    flex: 1,
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
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.massive,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
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
  deleteHeaderButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: `${colors.danger}18`,
    borderWidth: 1,
    borderColor: `${colors.danger}40`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formCard: {
    marginBottom: spacing.lg,
  },
  cardHeading: {
    fontFamily: fontFamilies.heading,
    fontSize: 16,
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  cardHeaderFlex: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  addPlanHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  addPlanBtnText: {
    fontFamily: fontFamilies.heading,
    fontSize: 11,
    color: colors.black,
    marginLeft: 3,
    letterSpacing: 0.5,
  },
  sectionSubLabel: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  prefixText: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 4,
  },
  suffixText: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 13,
    color: colors.textMuted,
    marginLeft: 4,
  },
  plansContainer: {
    marginBottom: spacing.md,
  },
  planOption: {
    backgroundColor: colors.inputBackground,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  selectedPlanOption: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  planInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planRadioDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  selectedPlanRadioDot: {
    borderColor: colors.primary,
  },
  planRadioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  planNameText: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 15,
    color: colors.text,
  },
  selectedPlanNameText: {
    color: colors.primary,
  },
  planPriceText: {
    fontFamily: fontFamilies.heading,
    fontSize: 18,
    color: colors.text,
  },
  selectedPlanPriceText: {
    color: colors.primary,
  },
  planDaysText: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    marginLeft: 26,
  },
  editablePlanBox: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    marginBottom: spacing.md,
  },
  editablePlanTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  editablePlanTitle: {
    fontFamily: fontFamilies.heading,
    fontSize: 12,
    color: colors.primary,
    letterSpacing: 0.5,
    marginLeft: 6,
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  durationPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.xs,
  },
  durationPill: {
    backgroundColor: colors.inputBackground,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeDurationPill: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  durationPillText: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 11,
    color: colors.textMuted,
  },
  activeDurationPillText: {
    color: colors.primary,
  },
  expiryDisplayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderAccent,
  },
  expiryInfoBlock: {
    marginLeft: spacing.md,
  },
  expirySubText: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  expiryBoldDate: {
    fontFamily: fontFamilies.heading,
    fontSize: 18,
    color: colors.primary,
    letterSpacing: 0.8,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.xs,
  },
  toggleLabel: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 14,
    color: colors.text,
  },
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: colors.inputBackground,
    borderRadius: radius.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleOption: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
  },
  activeToggle: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    fontFamily: fontFamilies.heading,
    fontSize: 13,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  activeToggleText: {
    color: colors.black,
  },
  paymentModeSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  paymentModeLabel: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  modeButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modeButton: {
    flex: 1,
    height: 44,
    backgroundColor: colors.inputBackground,
    borderRadius: radius.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 4,
  },
  activeModeButton: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  modeText: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 13,
    color: colors.textMuted,
  },
  activeModeText: {
    color: colors.primary,
  },
  submitButton: {
    marginTop: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontFamily: fontFamilies.heading,
    fontSize: 18,
    color: colors.text,
    letterSpacing: 0.5,
  },
  modalSubtitle: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  presetLabel: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  presetScroll: {
    marginBottom: spacing.md,
  },
  presetBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
  },
  activePresetBadge: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presetBadgeText: {
    fontFamily: fontFamilies.heading,
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  activePresetBadgeText: {
    color: colors.black,
  },
});
