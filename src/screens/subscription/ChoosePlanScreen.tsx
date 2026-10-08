import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Crown, Sparkles, Check, ExternalLink, ShieldCheck } from 'lucide-react-native';
import { colors, fontFamilies, radius, spacing } from '../../theme';
import { RootStackParamList } from '../../app/navigation/types';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { APP_CONFIG } from '../../config/app';
import { generateUpiUrl, openUpiPayment } from '../../utils/upi';
import { isValidUtr } from '../../utils/validators';
import { activateFreeTrial, submitFounderSubscriptionUtr } from '../../services/gym';
import { useAuthStore } from '../../store/useAuthStore';
import { useGymStore } from '../../store/useGymStore';
import { haptic } from '../../utils/haptics';
import { SubscriptionPeriod } from '../../types/models';

type ChoosePlanNavProp = NativeStackNavigationProp<RootStackParamList, 'ChoosePlan'>;

export const ChoosePlanScreen: React.FC = () => {
  const navigation = useNavigation<ChoosePlanNavProp>();
  const user = useAuthStore((s) => s.user);
  const { gym, loadGymData } = useGymStore();

  const [selectedTab, setSelectedTab] = useState<'TRIAL' | 'FOUNDER'>('TRIAL');
  const [subscriptionPeriod, setSubscriptionPeriod] = useState<SubscriptionPeriod>('yearly');
  const [utr, setUtr] = useState('');
  const [utrError, setUtrError] = useState('');
  const [loading, setLoading] = useState(false);

  const founderPrice =
    subscriptionPeriod === 'yearly'
      ? APP_CONFIG.SUBSCRIPTION.YEARLY.price
      : APP_CONFIG.SUBSCRIPTION.MONTHLY.price;

  const upiUrl = generateUpiUrl({
    upiId: APP_CONFIG.DEVELOPER_UPI_ID,
    name: APP_CONFIG.DEVELOPER_NAME,
    amount: founderPrice,
    note: `IronDesk Founder ${subscriptionPeriod}`,
  });

  const handleStartTrial = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await activateFreeTrial(user.uid);
      await loadGymData(user.uid);
      haptic.success();
      navigation.replace('Main', { screen: 'HomeTab' });
    } catch (error: any) {
      Alert.alert('Trial Error', error?.message || 'Could not activate trial.');
      haptic.error();
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUpi = async () => {
    haptic.medium();
    const opened = await openUpiPayment(upiUrl);
    if (!opened) {
      Alert.alert(
        'UPI App Not Found',
        `Please scan the QR code using Google Pay, PhonePe, or Paytm, or pay to: ${APP_CONFIG.DEVELOPER_UPI_ID}`
      );
    }
  };

  const handleSubmitUtr = async () => {
    setUtrError('');
    if (!isValidUtr(utr)) {
      setUtrError('Please enter a valid 8-22 digit UTR / UPI Transaction Reference');
      haptic.error();
      return;
    }

    if (!user) return;
    setLoading(true);
    try {
      await submitFounderSubscriptionUtr(user.uid, subscriptionPeriod, utr);
      await loadGymData(user.uid);
      haptic.success();
      Alert.alert(
        'Payment Submitted!',
        'Thank you! Your reference has been submitted. Full access is granted while our team verifies your payment.',
        [
          {
            text: 'ENTER APP',
            onPress: () => navigation.replace('Main', { screen: 'HomeTab' }),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Submission Error', error?.message || 'Could not submit UTR.');
      haptic.error();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.crownBadge}>
            <Crown size={32} color={colors.primary} />
          </View>
          <Text style={styles.title}>SELECT YOUR ACCESS</Text>
          <Text style={styles.subtitle}>
            Choose 30 days risk-free or claim the lifetime founder lock-in pricing.
          </Text>
        </View>

        {/* Plan Switcher Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'TRIAL' && styles.activeTab]}
            onPress={() => {
              haptic.light();
              setSelectedTab('TRIAL');
            }}
          >
            <Sparkles
              size={16}
              color={selectedTab === 'TRIAL' ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.tabText,
                selectedTab === 'TRIAL' && styles.activeTabText,
              ]}
            >
              30 DAYS FREE
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, selectedTab === 'FOUNDER' && styles.activeTab]}
            onPress={() => {
              haptic.light();
              setSelectedTab('FOUNDER');
            }}
          >
            <Crown
              size={16}
              color={selectedTab === 'FOUNDER' ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.tabText,
                selectedTab === 'FOUNDER' && styles.activeTabText,
              ]}
            >
              FOUNDER PASS
            </Text>
          </TouchableOpacity>
        </View>

        {/* Option 1: 30-Day Free Trial */}
        {selectedTab === 'TRIAL' ? (
          <Card style={styles.planCard} activeBorderColor={colors.primary}>
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>30 DAYS COMPLETELY FREE</Text>
            </View>

            <Text style={styles.planPriceTitle}>₹0</Text>
            <Text style={styles.planPriceSub}>No credit card or upfront UPI required</Text>

            <View style={styles.perksList}>
              <View style={styles.perkRow}>
                <Check size={18} color={colors.primary} />
                <Text style={styles.perkText}>Unlimited members & revenue analytics</Text>
              </View>
              <View style={styles.perkRow}>
                <Check size={18} color={colors.primary} />
                <Text style={styles.perkText}>1-tap WhatsApp payment & renewal reminders</Text>
              </View>
              <View style={styles.perkRow}>
                <Check size={18} color={colors.primary} />
                <Text style={styles.perkText}>Direct gym UPI QR integration for cash & online</Text>
              </View>
              <View style={styles.perkRow}>
                <Check size={18} color={colors.primary} />
                <Text style={styles.perkText}>Instant offline sync & local database backups</Text>
              </View>
            </View>

            <Button
              title="START FREE (30 DAYS)"
              onPress={handleStartTrial}
              loading={loading}
              variant="primary"
              style={styles.actionBtn}
            />
          </Card>
        ) : (
          /* Option 2: Founder Membership */
          <Card style={styles.planCard} activeBorderColor={colors.founderGold}>
            {/* Monthly vs Yearly Switcher */}
            <View style={styles.periodSwitcher}>
              <TouchableOpacity
                style={[
                  styles.periodOption,
                  subscriptionPeriod === 'monthly' && styles.activePeriodOption,
                ]}
                onPress={() => setSubscriptionPeriod('monthly')}
              >
                <Text
                  style={[
                    styles.periodText,
                    subscriptionPeriod === 'monthly' && styles.activePeriodText,
                  ]}
                >
                  ₹499 / MONTH
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.periodOption,
                  subscriptionPeriod === 'yearly' && styles.activePeriodOption,
                ]}
                onPress={() => setSubscriptionPeriod('yearly')}
              >
                <Text
                  style={[
                    styles.periodText,
                    subscriptionPeriod === 'yearly' && styles.activePeriodText,
                  ]}
                >
                  ₹4,999 / YEAR
                </Text>
                <View style={styles.saveBadge}>
                  <Text style={styles.saveBadgeText}>SAVE 16%</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* QR Code */}
            <View style={styles.qrContainer}>
              <View style={styles.qrWrapper}>
                <QRCode
                  value={upiUrl}
                  size={170}
                  backgroundColor="#FFFFFF"
                  color="#000000"
                />
              </View>
              <Text style={styles.scanInstruction}>
                Scan with GPay, PhonePe, or Paytm
              </Text>
              <Text style={styles.developerUpiText}>
                UPI ID: <Text style={styles.upiBold}>{APP_CONFIG.DEVELOPER_UPI_ID}</Text>
              </Text>
            </View>

            {/* Open UPI App Button */}
            <Button
              title={`PAY ₹${founderPrice} VIA UPI APP`}
              onPress={handleOpenUpi}
              variant="outline"
              icon={<ExternalLink size={18} color={colors.primary} />}
              style={styles.openUpiBtn}
            />

            {/* UTR Submission Box */}
            <View style={styles.utrSection}>
              <Input
                label="ENTER UPI / BANK UTR REFERENCE NUMBER"
                value={utr}
                onChangeText={(text) => {
                  setUtr(text);
                  if (utrError) setUtrError('');
                }}
                placeholder="12-digit UTR (e.g. 423985729104)"
                error={utrError}
                containerStyle={styles.utrInput}
              />

              <Button
                title="SUBMIT REFERENCE & GET ACCESS"
                onPress={handleSubmitUtr}
                loading={loading}
                disabled={utr.trim().length < 8}
                variant="primary"
              />
            </View>
          </Card>
        )}

        <View style={styles.footerNote}>
          <ShieldCheck size={16} color={colors.textMuted} />
          <Text style={styles.footerText}>
            Your gym data is 100% private and protected forever
          </Text>
        </View>
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
    paddingBottom: spacing.massive,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  crownBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fontFamilies.heading,
    fontSize: 28,
    color: colors.text,
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    lineHeight: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 4,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  activeTab: {
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.borderAccent,
  },
  tabText: {
    fontFamily: fontFamilies.heading,
    fontSize: 14,
    color: colors.textMuted,
    marginLeft: spacing.xs,
    letterSpacing: 0.8,
  },
  activeTabText: {
    color: colors.primary,
  },
  planCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  planBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
  },
  planBadgeText: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 11,
    color: colors.primary,
    letterSpacing: 0.8,
  },
  planPriceTitle: {
    fontFamily: fontFamilies.hero,
    fontSize: 52,
    color: colors.text,
    letterSpacing: 1,
  },
  planPriceSub: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  perksList: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  perkText: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: spacing.md,
    flex: 1,
  },
  actionBtn: {
    marginTop: spacing.sm,
  },
  periodSwitcher: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: colors.inputBackground,
    borderRadius: radius.card,
    padding: 4,
    marginBottom: spacing.xl,
  },
  periodOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  activePeriodOption: {
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  periodText: {
    fontFamily: fontFamilies.heading,
    fontSize: 14,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  activePeriodText: {
    color: colors.text,
  },
  saveBadge: {
    backgroundColor: colors.secondarySoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
    marginTop: 2,
  },
  saveBadgeText: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 9,
    color: colors.secondary,
  },
  qrContainer: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  qrWrapper: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.card,
    marginBottom: spacing.md,
  },
  scanInstruction: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 13,
    color: colors.text,
    marginTop: spacing.xs,
  },
  developerUpiText: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  upiBold: {
    color: colors.primary,
    fontWeight: '700',
  },
  openUpiBtn: {
    marginVertical: spacing.lg,
  },
  utrSection: {
    width: '100%',
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingTop: spacing.lg,
  },
  utrInput: {
    marginBottom: spacing.md,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
});
