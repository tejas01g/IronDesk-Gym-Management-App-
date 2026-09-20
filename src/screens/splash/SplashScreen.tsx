import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Dumbbell, Zap } from 'lucide-react-native';
import { colors, fontFamilies, spacing } from '../../theme';
import { RootStackParamList } from '../../app/navigation/types';
import { hasSeenOnboarding } from '../../utils/storage';
import { getCurrentUser } from '../../services/auth';
import { getGymDocument } from '../../services/gym';
import { useAuthStore } from '../../store/useAuthStore';
import { useGymStore } from '../../store/useGymStore';
import { isDateInPast } from '../../utils/dates';

type SplashScreenNavProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

export const SplashScreen: React.FC = () => {
  const navigation = useNavigation<SplashScreenNavProp>();
  const setUser = useAuthStore((s) => s.setUser);
  const { setGym, loadGymData } = useGymStore();

  const logoScale = useSharedValue(0.4);
  const logoOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(20);

  const checkInitialRouting = async () => {
    try {
      // 1. Check if user saw onboarding
      const seen = hasSeenOnboarding();
      if (!seen) {
        navigation.replace('Welcome');
        return;
      }

      // 2. Check if user is authenticated
      const user = getCurrentUser();
      if (!user) {
        navigation.replace('Login');
        return;
      }

      setUser(user);

      // 3. Fetch gym document
      const gymDoc = await getGymDocument(user.uid);
      if (!gymDoc) {
        navigation.replace('GymSetup');
        return;
      }

      // Load store data
      setGym(gymDoc);
      loadGymData(user.uid);

      // 4. Check plan status
      if (gymDoc.planStatus === 'expired') {
        navigation.replace('SubscriptionLock');
        return;
      }

      if (gymDoc.planStatus === 'trial' && gymDoc.trialEndsAt) {
        if (isDateInPast(gymDoc.trialEndsAt)) {
          navigation.replace('SubscriptionLock');
          return;
        }
      }

      // If user has not chosen trial or paid yet
      if (!gymDoc.trialEndsAt && gymDoc.planStatus === 'trial' && !gymDoc.utr) {
        navigation.replace('ChoosePlan');
        return;
      }

      // Valid trial, pending verification, or active
      navigation.replace('Main', { screen: 'HomeTab' });
    } catch (error) {
      console.warn('[SplashScreen] Routing error:', error);
      navigation.replace('Login');
    }
  };

  useEffect(() => {
    // Start entrance animations
    logoScale.value = withSpring(1, { damping: 10, stiffness: 120 });
    logoOpacity.value = withTiming(1, { duration: 600 });
    textTranslateY.value = withTiming(0, { duration: 600 }, (finished) => {
      if (finished) {
        runOnJS(checkInitialRouting)();
      }
    });
  }, []);

  const animatedLogoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <Animated.View style={[styles.logoBadge, animatedLogoStyle]}>
        <Dumbbell size={54} color={colors.primary} strokeWidth={2.4} />
      </Animated.View>

      <Animated.View style={[styles.textWrapper, animatedTextStyle]}>
        <View style={styles.titleRow}>
          <Text style={styles.brandTitle}>IRON</Text>
          <Text style={[styles.brandTitle, styles.brandAccent]}>DESK</Text>
          <Zap size={22} color={colors.primary} fill={colors.primary} style={styles.zapIcon} />
        </View>
        <Text style={styles.tagline}>THE DIGITAL REGISTER FOR INDIAN GYMS</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  logoBadge: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  textWrapper: {
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontFamily: fontFamilies.heading,
    fontSize: 44,
    color: colors.text,
    letterSpacing: 2,
  },
  brandAccent: {
    color: colors.primary,
  },
  zapIcon: {
    marginLeft: 6,
  },
  tagline: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
