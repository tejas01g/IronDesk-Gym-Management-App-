import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Dumbbell, ArrowLeft, RefreshCw, ShieldCheck } from 'lucide-react-native';
import { colors, fontFamilies, radius, spacing } from '../../theme';
import { RootStackParamList } from '../../app/navigation/types';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { OTPInput } from '../../components/OTPInput';
import { isValidIndianPhone } from '../../utils/validators';
import { sendPhoneOtp, confirmOtpCode } from '../../services/auth';
import { getGymDocument } from '../../services/gym';
import { useAuthStore } from '../../store/useAuthStore';
import { useGymStore } from '../../store/useGymStore';
import { haptic } from '../../utils/haptics';
import { FirebaseAuthTypes } from '../../services/firebase';

type LoginNavProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginNavProp>();
  const { setUser, setConfirmation } = useAuthStore();
  const { setGym, loadGymData } = useGymStore();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setLocalConfirmation] =
    useState<FirebaseAuthTypes.ConfirmationResult | null>(null);

  // Resend OTP countdown
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (step === 'OTP' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handleSendOtp = async () => {
    setPhoneError('');
    if (!isValidIndianPhone(phoneNumber)) {
      setPhoneError('Please enter a valid 10-digit Indian mobile number');
      haptic.error();
      return;
    }

    setLoading(true);
    try {
      const confirmation = await sendPhoneOtp(phoneNumber);
      setLocalConfirmation(confirmation);
      setConfirmation(confirmation);
      setStep('OTP');
      setResendTimer(30);
      setCanResend(false);
      haptic.success();
    } catch (error: any) {
      console.warn('[LoginScreen] Error sending OTP:', error);
      Alert.alert(
        'OTP Failed',
        error?.message || 'Could not send OTP. Please check the phone number and try again.'
      );
      haptic.error();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || loading) return;
    setLoading(true);
    try {
      const confirmation = await sendPhoneOtp(phoneNumber);
      setLocalConfirmation(confirmation);
      setConfirmation(confirmation);
      setResendTimer(30);
      setCanResend(false);
      haptic.success();
    } catch (error: any) {
      Alert.alert('Resend Error', error?.message || 'Unable to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (code: string) => {
    if (!confirmationResult || loading) return;
    setLoading(true);
    try {
      const userCredential = await confirmOtpCode(confirmationResult, code);
      if (!userCredential) {
        throw new Error('Verification failed. Please try again.');
      }
      const user = userCredential.user;
      setUser(user);
      haptic.success();

      // Check if gym profile exists
      const gym = await getGymDocument(user.uid);
      if (!gym) {
        navigation.replace('GymSetup');
      } else {
        setGym(gym);
        loadGymData(user.uid);
        if (gym.planStatus === 'expired') {
          navigation.replace('SubscriptionLock');
        } else if (!gym.trialEndsAt && gym.planStatus === 'trial' && !gym.utr) {
          navigation.replace('ChoosePlan');
        } else {
          navigation.replace('Main', { screen: 'HomeTab' });
        }
      }
    } catch (error: any) {
      console.warn('[LoginScreen] Error verifying OTP:', error);
      Alert.alert('Verification Failed', 'Incorrect OTP entered. Please try again.');
      haptic.error();
    } finally {
      setLoading(false);
    }
  };

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
        {/* Top bar */}
        {step === 'OTP' ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              haptic.light();
              setStep('PHONE');
            }}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.topSpacer} />
        )}

        {/* Hero Branding */}
        <View style={styles.brandHeader}>
          <View style={styles.logoBadge}>
            <Dumbbell size={36} color={colors.primary} strokeWidth={2.4} />
          </View>
          <Text style={styles.title}>
            {step === 'PHONE' ? 'ENTER YOUR MOBILE' : 'VERIFY OTP'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 'PHONE'
              ? 'We will send a 6-digit verification code to register or login to your gym.'
              : `Code sent to +91 ${phoneNumber}`}
          </Text>
        </View>

        {/* Step: Phone Input */}
        {step === 'PHONE' ? (
          <View style={styles.formSection}>
            <Input
              label="MOBILE NUMBER"
              value={phoneNumber}
              onChangeText={(text) => {
                setPhoneNumber(text.replace(/\D/g, '').slice(0, 10));
                if (phoneError) setPhoneError('');
              }}
              placeholder="98765 43210"
              keyboardType="number-pad"
              maxLength={10}
              prefix={
                <View style={styles.countryCodeBadge}>
                  <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                </View>
              }
              error={phoneError}
            />

            <Button
              title="SEND OTP"
              onPress={handleSendOtp}
              loading={loading}
              disabled={phoneNumber.length !== 10}
              variant="primary"
            />

            <View style={styles.securityNote}>
              <ShieldCheck size={16} color={colors.textMuted} />
              <Text style={styles.securityText}>
                Fast, secure OTP verification via SMS
              </Text>
            </View>
          </View>
        ) : (
          /* Step: OTP Verification */
          <View style={styles.formSection}>
            <OTPInput
              length={6}
              onComplete={handleVerifyOtp}
              disabled={loading}
            />

            <View style={styles.resendRow}>
              {canResend ? (
                <TouchableOpacity
                  onPress={handleResendOtp}
                  style={styles.resendButton}
                >
                  <RefreshCw size={16} color={colors.primary} />
                  <Text style={styles.resendActiveText}>RESEND OTP</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.resendWaitingText}>
                  Resend code in <Text style={styles.timerText}>{resendTimer}s</Text>
                </Text>
              )}
            </View>

            <TouchableOpacity
              onPress={() => setStep('PHONE')}
              style={styles.changePhoneButton}
            >
              <Text style={styles.changePhoneText}>WRONG NUMBER? CHANGE</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  topSpacer: {
    height: 44,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  brandHeader: {
    alignItems: 'center',
    marginVertical: spacing.xxl,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fontFamilies.heading,
    fontSize: 32,
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
    paddingHorizontal: spacing.lg,
    lineHeight: 20,
  },
  formSection: {
    width: '100%',
    marginTop: spacing.md,
  },
  countryCodeBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.xs,
    borderRightWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
  },
  countryCodeText: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 14,
    color: colors.text,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  securityText: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
  resendRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.lg,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resendActiveText: {
    fontFamily: fontFamilies.heading,
    fontSize: 16,
    color: colors.primary,
    marginLeft: spacing.xs,
    letterSpacing: 1,
  },
  resendWaitingText: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 14,
    color: colors.textMuted,
  },
  timerText: {
    color: colors.primary,
    fontWeight: '700',
  },
  changePhoneButton: {
    alignItems: 'center',
    padding: spacing.md,
  },
  changePhoneText: {
    fontFamily: fontFamilies.heading,
    fontSize: 14,
    color: colors.textMuted,
    letterSpacing: 1,
  },
});
