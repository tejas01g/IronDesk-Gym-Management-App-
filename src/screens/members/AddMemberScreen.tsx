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
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Trash2, Calendar, Check, AlertTriangle } from 'lucide-react-native';
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
import { isValidIndianPhone, isValidName } from '../../utils/validators';
import { formatDate, addDaysToDate, toJsDate } from '../../utils/dates';
import { formatINR } from '../../utils/money';
import { useGymStore } from '../../store/useGymStore';
import { haptic } from '../../utils/haptics';

type AddMemberNavProp = NativeStackNavigationProp<RootStackParamList, 'AddMember'>;
type AddMemberRouteProp = RouteProp<RootStackParamList, 'AddMember'>;

export const AddMemberScreen: React.FC = () => {
  const navigation = useNavigation<AddMemberNavProp>();
  const route = useRoute<AddMemberRouteProp>();
  const { gym, plans, loadGymData } = useGymStore();

  const memberId = route.params?.memberId;
  const isEditMode = Boolean(memberId);

  const [existingMember, setExistingMember] = useState<Member | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(
    plans[0] || null
  );
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
            const matchingPlan = plans.find((p) => p.id === m.planId);
            if (matchingPlan) setSelectedPlan(matchingPlan);
            setStartDate(toJsDate(m.startDate));
          }
        })
        .finally(() => setInitialLoading(false));
    }
  }, [isEditMode, memberId, gym?.ownerUid]);

  // Expiry calculation
  const calculatedExpiry = addDaysToDate(
    startDate,
    selectedPlan?.durationDays || 30
  );

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

    if (!selectedPlan) {
      errs.plan = 'Please select a membership plan';
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

    try {
      if (isEditMode && memberId) {
        await updateMember(gym.ownerUid, memberId, {
          name: name.trim(),
          phone: phone.trim(),
          notes: notes.trim(),
        });
        haptic.success();
        Alert.alert('Success', 'Member details updated successfully.');
        navigation.goBack();
      } else {
        await addMemberWithStats(gym.ownerUid, {
          name: name.trim(),
          phone: phone.trim(),
          planId: selectedPlan!.id,
          planName: selectedPlan!.name,
          planPrice: selectedPlan!.price,
          startDate,
          durationDays: selectedPlan!.durationDays,
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
    <KeyboardAvoidingView
      style={styles.container}
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

        {/* Membership Plan Selection (Only for new members) */}
        {!isEditMode && (
          <Card style={styles.formCard}>
            <Text style={styles.cardHeading}>SELECT MEMBERSHIP PLAN</Text>

            <View style={styles.plansContainer}>
              {plans.map((plan) => {
                const isSelected = selectedPlan?.id === plan.id;
                return (
                  <TouchableOpacity
                    key={plan.id}
                    onPress={() => {
                      haptic.light();
                      setSelectedPlan(plan);
                    }}
                    style={[
                      styles.planOption,
                      isSelected && styles.selectedPlanOption,
                    ]}
                    activeOpacity={0.8}
                  >
                    <View style={styles.planInfoRow}>
                      <Text
                        style={[
                          styles.planNameText,
                          isSelected && styles.selectedPlanNameText,
                        ]}
                      >
                        {plan.name}
                      </Text>
                      <Text
                        style={[
                          styles.planPriceText,
                          isSelected && styles.selectedPlanPriceText,
                        ]}
                      >
                        {formatINR(plan.price)}
                      </Text>
                    </View>
                    <Text style={styles.planDaysText}>{plan.durationDays} Days duration</Text>
                  </TouchableOpacity>
                );
              })}
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
        )}

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
    </KeyboardAvoidingView>
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
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
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
  prefixText: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 4,
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
});
