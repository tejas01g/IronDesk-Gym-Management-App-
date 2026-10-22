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
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  CheckCircle2,
  Share2,
  MessageSquare,
  QrCode,
  Banknote,
  Calendar,
  Sparkles,
  User,
} from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { colors, fontFamilies, radius, spacing } from '../../theme';
import { RootStackParamList } from '../../app/navigation/types';
import { Member, MembershipPlan, PaymentMode } from '../../types/models';
import { collectFeeWithStats } from '../../services/payments';
import { getMembersPaginated, getMemberById } from '../../services/members';
import { calculateNewExpiry } from '../../utils/memberStatus';
import { formatDate } from '../../utils/dates';
import { formatINR } from '../../utils/money';
import { generateUpiUrl } from '../../utils/upi';
import { openWhatsApp, formatWhatsAppMessage } from '../../utils/whatsapp';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { useGymStore } from '../../store/useGymStore';
import { haptic } from '../../utils/haptics';

type CollectFeeNavProp = NativeStackNavigationProp<RootStackParamList, 'CollectFee'>;
type CollectFeeRouteProp = RouteProp<RootStackParamList, 'CollectFee'>;

export const CollectFeeScreen: React.FC = () => {
  const navigation = useNavigation<CollectFeeNavProp>();
  const route = useRoute<CollectFeeRouteProp>();
  const { gym, plans, loadGymData } = useGymStore();

  const [selectedMember, setSelectedMember] = useState<Member | null>(
    route.params?.member || null
  );
  const [memberList, setMemberList] = useState<Member[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(
    plans[0] || null
  );
  const [customAmount, setCustomAmount] = useState<string>(
    String(plans[0]?.price || 1000)
  );
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('upi');

  const [isSuccess, setIsSuccess] = useState(false);
  const [newCalculatedExpiry, setNewCalculatedExpiry] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);

  const checkScale = useSharedValue(0);

  // Load member if memberId was passed but not member object
  useEffect(() => {
    if (!selectedMember && route.params?.memberId && gym?.ownerUid) {
      getMemberById(gym.ownerUid, route.params.memberId).then((m) => {
        if (m) {
          setSelectedMember(m);
          const currentPlan = plans.find((p) => p.id === m.planId);
          if (currentPlan) {
            setSelectedPlan(currentPlan);
            setCustomAmount(String(currentPlan.price));
          }
        }
      });
    } else if (!selectedMember && gym?.ownerUid) {
      // Fetch members for picker
      getMembersPaginated(gym.ownerUid, 'all', null, 50).then((res) => {
        setMemberList(res.members);
      });
    }
  }, [selectedMember, route.params?.memberId, gym?.ownerUid]);

  // Recalculate expiry whenever member or plan changes
  useEffect(() => {
    if (selectedPlan) {
      const isRenewal = Boolean(selectedMember);
      const currentExpiry = selectedMember ? selectedMember.expiryDate : null;
      const expiry = calculateNewExpiry(
        currentExpiry,
        selectedPlan.durationDays,
        isRenewal
      );
      setNewCalculatedExpiry(expiry);
    }
  }, [selectedMember, selectedPlan]);

  const handlePlanSelect = (plan: MembershipPlan) => {
    haptic.light();
    setSelectedPlan(plan);
    setCustomAmount(String(plan.price));
  };

  const amountNum = parseFloat(customAmount) || 0;

  // Generate UPI QR code for gym owner
  const upiUrl = generateUpiUrl({
    upiId: gym?.upiId || '',
    name: gym?.gymName || 'Gym Fees',
    amount: amountNum,
    note: `Gym Fee - ${selectedMember?.name || 'Member'}`,
  });

  const handleSendUpiLinkOnWhatsApp = async () => {
    if (!selectedMember) return;
    haptic.medium();

    const text = `Hi ${selectedMember.name}, here is the UPI payment link of ₹${amountNum} for your membership renewal at ${gym?.gymName || 'our gym'}:\n\n${upiUrl}\n\nPlease let us know once paid!`;
    await openWhatsApp(selectedMember.phone, text);
  };

  const handleConfirmPayment = async () => {
    if (!selectedMember || !selectedPlan || !gym?.ownerUid) {
      Alert.alert('Incomplete', 'Please select a member and membership plan.');
      return;
    }

    setLoading(true);
    try {
      await collectFeeWithStats(gym.ownerUid, {
        member: selectedMember,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        amount: amountNum,
        mode: paymentMode,
        newExpiryDate: newCalculatedExpiry,
      });

      await loadGymData(gym.ownerUid);
      haptic.success();
      setIsSuccess(true);
      checkScale.value = withSpring(1, { damping: 10, stiffness: 140 });
    } catch (error: any) {
      console.warn('[CollectFee] Error collecting fee:', error);
      Alert.alert('Collection Error', error?.message || 'Could not record payment.');
      haptic.error();
    } finally {
      setLoading(false);
    }
  };

  const handleSendReceipt = async () => {
    if (!selectedMember) return;
    haptic.light();

    const receiptMessage = `*PAYMENT RECEIPT - ${gym?.gymName?.toUpperCase()}*\n\n` +
      `👤 Member: ${selectedMember.name}\n` +
      `📦 Plan: ${selectedPlan?.name}\n` +
      `💰 Amount Paid: ${formatINR(amountNum)}\n` +
      `💳 Mode: ${paymentMode.toUpperCase()}\n` +
      `📅 New Expiry Date: ${formatDate(newCalculatedExpiry)}\n\n` +
      `Thank you for working out with us! Stay consistent. 💪`;

    await openWhatsApp(selectedMember.phone, receiptMessage);
  };

  const animatedCheckStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  // SUCCESS SCREEN
  if (isSuccess && selectedMember) {
    return (
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <View style={styles.successWrapper}>
          <Animated.View style={[styles.successIconBadge, animatedCheckStyle]}>
            <CheckCircle2 size={64} color={colors.primary} strokeWidth={2.4} />
          </Animated.View>

          <Text style={styles.successTitle}>PAYMENT RECORDED!</Text>
          <Text style={styles.successSubtitle}>
            {formatINR(amountNum)} successfully received via {paymentMode.toUpperCase()}
          </Text>

          {/* New Expiry Card */}
          <Card style={styles.successInfoCard} activeBorderColor={colors.primary}>
            <View style={styles.successRow}>
              <Text style={styles.successLabel}>MEMBER</Text>
              <Text style={styles.successValue}>{selectedMember.name}</Text>
            </View>
            <View style={styles.successRow}>
              <Text style={styles.successLabel}>PLAN EXTENDED</Text>
              <Text style={styles.successValue}>{selectedPlan?.name}</Text>
            </View>
            <View style={[styles.successRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.successLabel}>NEW EXPIRY DATE</Text>
              <Text style={[styles.successValue, styles.highlightDate]}>
                {formatDate(newCalculatedExpiry)}
              </Text>
            </View>
          </Card>

          {/* WhatsApp Receipt Button */}
          <Button
            title="SEND RECEIPT ON WHATSAPP"
            onPress={handleSendReceipt}
            variant="outline"
            icon={<MessageSquare size={18} color={colors.whatsapp} />}
            style={styles.receiptButton}
          />

          <Button
            title="DONE / BACK TO DASHBOARD"
            onPress={() => navigation.replace('Main', { screen: 'HomeTab' })}
            variant="primary"
            style={{ width: '100%' }}
          />
        </View>
      </SafeAreaView>
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>COLLECT MEMBERSHIP FEE</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Member Selector (if not preselected) */}
        {!selectedMember ? (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>SELECT MEMBER</Text>
            <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
              {memberList.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => {
                    haptic.light();
                    setSelectedMember(m);
                  }}
                  style={styles.memberSelectItem}
                >
                  <User size={16} color={colors.primary} />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.pickerMemberName}>{m.name}</Text>
                    <Text style={styles.pickerMemberPhone}>{m.phone}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Card>
        ) : (
          <Card style={styles.sectionCard}>
            <View style={styles.selectedMemberRow}>
              <View>
                <Text style={styles.labelMuted}>COLLECTING FOR</Text>
                <Text style={styles.selectedMemberName}>{selectedMember.name}</Text>
                <Text style={styles.selectedMemberPhone}>{selectedMember.phone}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedMember(null)}
                style={styles.changePill}
              >
                <Text style={styles.changePillText}>CHANGE</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Plan Picker */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>CHOOSE PLAN</Text>
          <View style={styles.planSelectorRow}>
            {plans.map((plan) => {
              const isSelected = selectedPlan?.id === plan.id;
              return (
                <TouchableOpacity
                  key={plan.id}
                  onPress={() => handlePlanSelect(plan)}
                  style={[
                    styles.planChip,
                    isSelected && styles.selectedPlanChip,
                  ]}
                >
                  <Text
                    style={[
                      styles.planChipName,
                      isSelected && styles.selectedPlanChipName,
                    ]}
                  >
                    {plan.name}
                  </Text>
                  <Text
                    style={[
                      styles.planChipPrice,
                      isSelected && styles.selectedPlanChipPrice,
                    ]}
                  >
                    {formatINR(plan.price)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Editable Amount */}
        <Card style={styles.sectionCard}>
          <Input
            label="FINAL AMOUNT TO RECEIVE (₹)"
            value={customAmount}
            onChangeText={(text) => setCustomAmount(text.replace(/\D/g, ''))}
            keyboardType="number-pad"
            placeholder="1000"
            prefix={<Text style={styles.currencyPrefix}>₹</Text>}
          />

          {/* New Expiry preview */}
          <View style={styles.expiryPreviewBox}>
            <Calendar size={18} color={colors.primary} />
            <View style={{ marginLeft: spacing.sm }}>
              <Text style={styles.expiryPreviewLabel}>New Expiry After Renewal:</Text>
              <Text style={styles.expiryPreviewDate}>
                {formatDate(newCalculatedExpiry)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Payment Mode Selector */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>PAYMENT METHOD</Text>
          <View style={styles.modeTabsRow}>
            <TouchableOpacity
              style={[
                styles.modeTab,
                paymentMode === 'upi' && styles.activeModeTab,
              ]}
              onPress={() => {
                haptic.light();
                setPaymentMode('upi');
              }}
            >
              <QrCode
                size={18}
                color={paymentMode === 'upi' ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  styles.modeTabText,
                  paymentMode === 'upi' && styles.activeModeTabText,
                ]}
              >
                UPI / QR CODE
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeTab,
                paymentMode === 'cash' && styles.activeModeTab,
              ]}
              onPress={() => {
                haptic.light();
                setPaymentMode('cash');
              }}
            >
              <Banknote
                size={18}
                color={paymentMode === 'cash' ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  styles.modeTabText,
                  paymentMode === 'cash' && styles.activeModeTabText,
                ]}
              >
                CASH PAYMENT
              </Text>
            </TouchableOpacity>
          </View>

          {/* UPI View with QR Code */}
          {paymentMode === 'upi' ? (
            <View style={styles.upiDisplaySection}>
              <View style={styles.qrCard}>
                <QRCode
                  value={upiUrl}
                  size={180}
                  backgroundColor="#FFFFFF"
                  color="#000000"
                />
              </View>

              <Text style={styles.qrHelperText}>
                Member scans this QR to pay {formatINR(amountNum)} directly to your UPI
              </Text>

              <Text style={styles.ownerUpiText}>
                UPI ID: <Text style={styles.upiBold}>{gym?.upiId || 'Not configured'}</Text>
              </Text>

              {/* Share on WhatsApp button */}
              <Button
                title="SEND PAYMENT LINK ON WHATSAPP"
                onPress={handleSendUpiLinkOnWhatsApp}
                variant="outline"
                icon={<MessageSquare size={18} color={colors.whatsapp} />}
                style={styles.shareWhatsappBtn}
              />
            </View>
          ) : (
            <View style={styles.cashDisplaySection}>
              <View style={styles.cashNoticeBox}>
                <Text style={styles.cashNoticeTitle}>COLLECTING CASH</Text>
                <Text style={styles.cashNoticeAmount}>{formatINR(amountNum)}</Text>
                <Text style={styles.cashNoticeSub}>
                  Collect paper cash from member and confirm below to record in monthly accounts.
                </Text>
              </View>
            </View>
          )}
        </Card>

        {/* CTA Confirmation Button */}
        <Button
          title={paymentMode === 'upi' ? 'PAYMENT RECEIVED VIA UPI' : 'CONFIRM CASH RECEIVED'}
          onPress={handleConfirmPayment}
          loading={loading}
          disabled={!selectedMember || amountNum <= 0}
          variant="primary"
          style={styles.submitBtn}
        />
      </ScrollView>
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
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  sectionCard: {
    marginBottom: spacing.lg,
  },
  sectionHeading: {
    fontFamily: fontFamilies.heading,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
    marginBottom: spacing.md,
  },
  selectedMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelMuted: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 0.3,
  },
  selectedMemberName: {
    fontFamily: fontFamilies.heading,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.2,
  },
  selectedMemberPhone: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 13,
    color: colors.textMuted,
  },
  changePill: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  changePillText: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 11,
    color: colors.primary,
    letterSpacing: 0.3,
  },
  memberSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  pickerMemberName: {
    fontFamily: fontFamilies.heading,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  pickerMemberPhone: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 12,
    color: colors.textMuted,
  },
  planSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  planChip: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.glassPill,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopColor: colors.glassBorderLight,
  },
  selectedPlanChip: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    borderTopColor: colors.primary,
  },
  planChipName: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 13,
    color: colors.textSecondary,
  },
  selectedPlanChipName: {
    color: colors.primary,
  },
  planChipPrice: {
    fontFamily: fontFamilies.statNumber,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  selectedPlanChipPrice: {
    color: colors.primary,
  },
  currencyPrefix: {
    fontFamily: fontFamilies.statNumber,
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 4,
  },
  expiryPreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    marginTop: spacing.xs,
  },
  expiryPreviewLabel: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  expiryPreviewDate: {
    fontFamily: fontFamilies.statNumber,
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  modeTabsRow: {
    flexDirection: 'row',
    backgroundColor: colors.glassPill,
    borderRadius: radius.card,
    padding: 4,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopColor: colors.glassBorderLight,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  activeModeTab: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.glassBorderLight,
  },
  modeTabText: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 13,
    color: colors.textMuted,
    marginLeft: spacing.xs,
    letterSpacing: 0.2,
  },
  activeModeTabText: {
    color: colors.text,
  },
  upiDisplaySection: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  qrCard: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.card,
    marginBottom: spacing.md,
  },
  qrHelperText: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    lineHeight: 18,
  },
  ownerUpiText: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  upiBold: {
    color: colors.primary,
    fontWeight: '700',
  },
  shareWhatsappBtn: {
    width: '100%',
    marginTop: spacing.lg,
  },
  cashDisplaySection: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  cashNoticeBox: {
    width: '100%',
    backgroundColor: colors.glassPill,
    padding: spacing.xl,
    borderRadius: radius.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderTopColor: colors.glassBorderLight,
  },
  cashNoticeTitle: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 14,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  cashNoticeAmount: {
    fontFamily: fontFamilies.statNumber,
    fontSize: 36,
    fontWeight: '700',
    color: colors.primary,
    marginVertical: spacing.xs,
  },
  cashNoticeSub: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  submitBtn: {
    marginTop: spacing.sm,
  },
  successWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  successIconBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primarySoft,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  successTitle: {
    fontFamily: fontFamilies.heading,
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  successSubtitle: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  successInfoCard: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  successLabel: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 12,
    color: colors.textMuted,
  },
  successValue: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 14,
    color: colors.text,
  },
  highlightDate: {
    color: colors.primary,
    fontFamily: fontFamilies.heading,
    fontSize: 18,
  },
  receiptButton: {
    width: '100%',
    marginBottom: spacing.md,
    borderColor: `${colors.whatsapp}60`,
  },
});
