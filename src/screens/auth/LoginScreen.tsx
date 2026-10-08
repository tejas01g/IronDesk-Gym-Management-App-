import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Dumbbell, ArrowLeft, RefreshCw, ShieldCheck } from 'lucide-react-native';
import { colors, fontFamilies, radius, spacing } from '../../theme';
import { RootStackParamList } from '../../app/navigation/types';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { OTPInput } from '../../components/OTPInput';
import { SafeAreaView } from 'react-native-safe-area-context';
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

  // otpSending: Firebase is doing Play Integrity check + sending SMS in background
  const [otpSending, setOtpSending] = useState(false);
  // loading: OTP verify call in progress
  const [loading, setLoading] = useState(false);

  const [confirmationResult, setLocalConfirmation] =
    useState<FirebaseAuthTypes.ConfirmationResult | null>(null);

  // Resend OTP countdown
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Pulse animation for "Sending OTP…" indicator
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (otpSending) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.35, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [otpSending, pulseAnim]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (step === 'OTP' && !canResend) {
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
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, canResend]);

  const handleSendOtp = async () => {
    setPhoneError('');
    if (!isValidIndianPhone(phoneNumber)) {
      setPhoneError('Please enter a valid 10-digit Indian mobile number');
      haptic.error();
      return;
    }

    // ── Optimistic UI: jump to OTP screen instantly ──
    setLocalConfirmation(null);
    setStep('OTP');
    setResendTimer(30);
    setCanResend(false);
    setOtpSending(true);

    // ── Firebase auth (Play Integrity + SMS) runs silently in background ──
    try {
      const confirmation = await sendPhoneOtp(phoneNumber);
      setLocalConfirmation(confirmation);
      setConfirmation(confirmation);
      haptic.success();
    } catch (error: any) {
      console.warn('[LoginScreen] Error sending OTP:', error);
      // Snap back to phone step and show the error
      setStep('PHONE');
      Alert.alert(
        'OTP Failed',
        error?.message || 'Could not send OTP. Please check the phone number and try again.'
      );
      haptic.error();
    } finally {
      setOtpSending(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || loading || otpSending) return;
    setLocalConfirmation(null);
    setOtpSending(true);
    setResendTimer(30);
    setCanResend(false);
    try {
      const confirmation = await sendPhoneOtp(phoneNumber);
      setLocalConfirmation(confirmation);
      setConfirmation(confirmation);
      haptic.success();
    } catch (error: any) {
      Alert.alert('Resend Error', error?.message || 'Unable to resend OTP.');
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async (code: string) => {
    if (!confirmationResult || loading || otpSending) return;
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
          {/* Top bar */}
          {step === 'OTP' ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                if (otpSending) return; // don't navigate back while OTP is in flight
                haptic.light();
                setStep('PHONE');
                setLocalConfirmation(null);
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
                loading={false}
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

              {/* Background OTP sending indicator — pulsing pill */}
              {otpSending && (
                <Animated.View style={[styles.sendingPill, { opacity: pulseAnim }]}>
                  <View style={styles.sendingDot} />
                  <Text style={styles.sendingText}>Sending OTP to your phone…</Text>
                </Animated.View>
              )}

              {/* OTP boxes — locked until confirmationResult is ready */}
              <OTPInput
                length={6}
                onComplete={handleVerifyOtp}
                disabled={loading || otpSending || !confirmationResult}
              />

              {/* Subtle hint while OTP input is locked */}
              {otpSending && (
                <Text style={styles.waitHint}>
                  Enter the code once you receive the SMS
                </Text>
              )}

              <View style={styles.resendRow}>
                {canResend ? (
                  <TouchableOpacity
                    onPress={handleResendOtp}
                    style={styles.resendButton}
                    disabled={otpSending}
                  >
                    <RefreshCw
                      size={16}
                      color={otpSending ? colors.textDisabled : colors.primary}
                    />
                    <Text
                      style={[
                        styles.resendActiveText,
                        otpSending && { color: colors.textDisabled },
                      ]}
                    >
                      RESEND OTP
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.resendWaitingText}>
                    Resend code in <Text style={styles.timerText}>{resendTimer}s</Text>
                  </Text>
                )}
              </View>

              <TouchableOpacity
                onPress={() => {
                  if (otpSending) return;
                  setStep('PHONE');
                  setLocalConfirmation(null);
                }}
                style={styles.changePhoneButton}
              >
                <Text style={styles.changePhoneText}>WRONG NUMBER? CHANGE</Text>
              </TouchableOpacity>
            </View>
          )}
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
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  topSpacer: {
    height: spacing.sm,
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
  // ── Sending indicator ──
  sendingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.lg,
  },
  sendingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: spacing.xs,
  },
  sendingText: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 13,
    color: colors.primary,
    letterSpacing: 0.2,
  },
  waitHint: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
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
