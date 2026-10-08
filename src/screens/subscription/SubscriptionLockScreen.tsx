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
import { Lock, ShieldAlert, MessageSquare, ExternalLink, LogOut, RefreshCw } from 'lucide-react-native';
import { colors, fontFamilies, radius, spacing } from '../../theme';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { APP_CONFIG } from '../../config/app';
import { generateUpiUrl, openUpiPayment } from '../../utils/upi';
import { isValidUtr } from '../../utils/validators';
import { openWhatsApp } from '../../utils/whatsapp';
import { submitFounderSubscriptionUtr } from '../../services/gym';
import { useAuthStore } from '../../store/useAuthStore';
import { useGymStore } from '../../store/useGymStore';
import { haptic } from '../../utils/haptics';
import { SubscriptionPeriod } from '../../types/models';

export const SubscriptionLockScreen: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { gym, loadGymData } = useGymStore();

  const [period, setPeriod] = useState<SubscriptionPeriod>('yearly');
  const [utr, setUtr] = useState('');
  const [utrError, setUtrError] = useState('');
  const [loading, setLoading] = useState(false);

  const price =
    period === 'yearly'
      ? APP_CONFIG.SUBSCRIPTION.YEARLY.price
      : APP_CONFIG.SUBSCRIPTION.MONTHLY.price;

  const upiUrl = generateUpiUrl({
    upiId: APP_CONFIG.DEVELOPER_UPI_ID,
    name: APP_CONFIG.DEVELOPER_NAME,
    amount: price,
    note: `Renew ${gym?.gymName || 'Gym'}`,
  });

  const handleOpenUpi = async () => {
    haptic.medium();
    await openUpiPayment(upiUrl);
  };

  const handleSupportWhatsApp = async () => {
    haptic.light();
    await openWhatsApp(
      APP_CONFIG.DEVELOPER_WHATSAPP,
      `Hi IronDesk Support, I need help renewing my gym subscription for "${gym?.gymName || 'my gym'}".`
    );
  };

  const handleSubmitRenewal = async () => {
    setUtrError('');
    if (!isValidUtr(utr)) {
      setUtrError('Please enter a valid UTR / transaction reference number');
      haptic.error();
      return;
    }

    if (!user) return;
    setLoading(true);
    try {
      await submitFounderSubscriptionUtr(user.uid, period, utr);
      await loadGymData(user.uid);
      haptic.success();
      Alert.alert(
        'Renewal Submitted!',
        'Thank you! Your reference number has been submitted. Our team will verify and reactivate your subscription shortly.'
      );
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to submit reference.');
      haptic.error();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Lock Hero Icon */}
        <View style={styles.lockBadge}>
          <Lock size={44} color={colors.secondary} strokeWidth={2.4} />
        </View>

        <Text style={styles.title}>SUBSCRIPTION EXPIRED</Text>
        <Text style={styles.subtitle}>
          Your free trial or pass duration has concluded.
        </Text>

        {/* Safety Guarantee Notice */}
        <View style={styles.safetyBanner}>
          <ShieldAlert size={20} color={colors.primary} />
          <Text style={styles.safetyText}>
            DON'T WORRY: None of your data has been deleted. All members, payment logs, and registers are 100% safe.
          </Text>
        </View>

        {/* Renewal Card */}
        <Card style={styles.card} activeBorderColor={colors.secondary}>
          <Text style={styles.cardHeader}>RENEW ACCESS NOW</Text>

          {/* Period Selector */}
          <View style={styles.periodSwitcher}>
            <TouchableOpacity
              style={[
                styles.periodOption,
                period === 'monthly' && styles.activePeriodOption,
              ]}
              onPress={() => setPeriod('monthly')}
            >
              <Text
                style={[
                  styles.periodText,
                  period === 'monthly' && styles.activePeriodText,
                ]}
              >
                ₹499 / MO
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.periodOption,
                period === 'yearly' && styles.activePeriodOption,
              ]}
              onPress={() => setPeriod('yearly')}
            >
              <Text
                style={[
                  styles.periodText,
                  period === 'yearly' && styles.activePeriodText,
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
                size={160}
                backgroundColor="#FFFFFF"
                color="#000000"
              />
            </View>
            <Text style={styles.upiIdText}>
              Pay to: <Text style={styles.upiBold}>{APP_CONFIG.DEVELOPER_UPI_ID}</Text>
            </Text>
          </View>

          <Button
            title={`PAY ₹${price} VIA UPI APP`}
            onPress={handleOpenUpi}
            variant="outline"
            icon={<ExternalLink size={18} color={colors.primary} />}
            style={styles.openUpiBtn}
          />

          {/* UTR Input */}
          <Input
            label="UTR / TRANSACTION REFERENCE"
            value={utr}
            onChangeText={(text) => {
              setUtr(text);
              if (utrError) setUtrError('');
            }}
            placeholder="Enter 12-digit UTR number"
            error={utrError}
          />

          <Button
            title="SUBMIT RENEWAL"
            onPress={handleSubmitRenewal}
            loading={loading}
            variant="secondary"
          />
        </Card>

        {/* WhatsApp Developer Support */}
        <TouchableOpacity
          onPress={handleSupportWhatsApp}
          style={styles.supportButton}
          activeOpacity={0.8}
        >
          <MessageSquare size={18} color={colors.whatsapp} />
          <Text style={styles.supportText}>NEED HELP? CHAT ON WHATSAPP</Text>
        </TouchableOpacity>

        {/* Logout Option */}
        <TouchableOpacity
          onPress={() => logout()}
          style={styles.logoutButton}
          activeOpacity={0.8}
        >
          <LogOut size={16} color={colors.textMuted} />
          <Text style={styles.logoutText}>SIGN OUT</Text>
        </TouchableOpacity>
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.massive,
    alignItems: 'center',
  },
  lockBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fontFamilies.heading,
    fontSize: 32,
    color: colors.text,
    letterSpacing: 1.5,
  },
  subtitle: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  safetyBanner: {
    flexDirection: 'row',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderAccent,
  },
  safetyText: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 12,
    color: colors.primary,
    marginLeft: spacing.sm,
    flex: 1,
    lineHeight: 18,
  },
  card: {
    width: '100%',
    padding: spacing.xl,
    alignItems: 'center',
  },
  cardHeader: {
    fontFamily: fontFamilies.heading,
    fontSize: 20,
    color: colors.text,
    letterSpacing: 1,
    marginBottom: spacing.lg,
  },
  periodSwitcher: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: colors.inputBackground,
    borderRadius: radius.card,
    padding: 4,
    marginBottom: spacing.lg,
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
    marginBottom: spacing.sm,
  },
  upiIdText: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 12,
    color: colors.textMuted,
  },
  upiBold: {
    color: colors.primary,
    fontWeight: '700',
  },
  openUpiBtn: {
    width: '100%',
    marginVertical: spacing.md,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    padding: spacing.md,
  },
  supportText: {
    fontFamily: fontFamilies.heading,
    fontSize: 14,
    color: colors.whatsapp,
    marginLeft: spacing.xs,
    letterSpacing: 0.8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  logoutText: {
    fontFamily: fontFamilies.heading,
    fontSize: 14,
    color: colors.textMuted,
    marginLeft: spacing.xs,
    letterSpacing: 0.8,
  },
});
