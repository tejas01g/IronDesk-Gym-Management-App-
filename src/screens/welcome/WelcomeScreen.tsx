import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Users, BellRing, TrendingUp, ChevronRight } from 'lucide-react-native';
import { colors, fontFamilies, radius, spacing } from '../../theme';
import { RootStackParamList } from '../../app/navigation/types';
import { Button } from '../../components/Button';
import { setHasSeenOnboarding } from '../../utils/storage';
import { haptic } from '../../utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SlideItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: any;
  accent: string;
}

const SLIDES: SlideItem[] = [
  {
    id: '1',
    title: 'TRACK MEMBERS',
    subtitle: '& ACTIVE PLANS',
    description:
      'Throw away the paper register. Manage all member admissions, active memberships, and contact records right from your pocket.',
    icon: Users,
    accent: colors.primary,
  },
  {
    id: '2',
    title: 'NEVER MISS',
    subtitle: 'A PLAN RENEWAL',
    description:
      'Automatic alerts for members expiring in 7 days. Send pre-filled WhatsApp reminders with your UPI QR code in 1 tap.',
    icon: BellRing,
    accent: colors.secondary,
  },
  {
    id: '3',
    title: 'SEE REVENUE',
    subtitle: 'AT A GLANCE',
    description:
      'Track total monthly collections, pending dues, and daily gym check-ins in real time with zero calculation headache.',
    icon: TrendingUp,
    accent: colors.success,
  },
];

type WelcomeNavProp = NativeStackNavigationProp<RootStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<WelcomeNavProp>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const completeOnboarding = () => {
    setHasSeenOnboarding(true);
    navigation.replace('Login');
  };

  const handleNext = () => {
    haptic.light();
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
      setCurrentIndex(currentIndex + 1);
    } else {
      completeOnboarding();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Top Header with Skip */}
      <View style={styles.header}>
        <View style={styles.badgePill}>
          <Text style={styles.badgeText}>IRONDDESK 1.0</Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            haptic.light();
            completeOnboarding();
          }}
          style={styles.skipButton}
        >
          <Text style={styles.skipText}>SKIP</Text>
        </TouchableOpacity>
      </View>

      {/* Slide Pager */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentIndex(index);
        }}
        renderItem={({ item }) => {
          const IconComponent = item.icon;
          return (
            <View style={styles.slide}>
              {/* Feature Icon Graphic */}
              <View
                style={[
                  styles.iconOuterCircle,
                  { borderColor: item.accent },
                ]}
              >
                <View
                  style={[
                    styles.iconInnerCircle,
                    { backgroundColor: `${item.accent}18` },
                  ]}
                >
                  <IconComponent size={64} color={item.accent} strokeWidth={2.2} />
                </View>
              </View>

              {/* Headings */}
              <Text style={styles.slideTitle}>{item.title}</Text>
              <Text style={[styles.slideSubtitle, { color: item.accent }]}>
                {item.subtitle}
              </Text>

              {/* Description */}
              <Text style={styles.slideDescription}>{item.description}</Text>
            </View>
          );
        }}
      />

      {/* Bottom Controls */}
      <View style={styles.footer}>
        {/* Pagination Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, index) => {
            const isActive = currentIndex === index;
            return (
              <View
                key={index}
                style={[
                  styles.dot,
                  isActive && styles.activeDot,
                ]}
              />
            );
          })}
        </View>

        {/* CTA Button */}
        <Button
          title={currentIndex === SLIDES.length - 1 ? 'GET STARTED' : 'CONTINUE'}
          onPress={handleNext}
          variant="primary"
          icon={
            currentIndex < SLIDES.length - 1 ? (
              <ChevronRight size={20} color={colors.black} />
            ) : undefined
          }
        />
      </View>
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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
  },
  badgePill: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 11,
    color: colors.primary,
    letterSpacing: 1,
  },
  skipButton: {
    padding: spacing.sm,
  },
  skipText: {
    fontFamily: fontFamilies.heading,
    fontSize: 16,
    color: colors.textMuted,
    letterSpacing: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  iconOuterCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxxl,
  },
  iconInnerCircle: {
    width: 116,
    height: 116,
    borderRadius: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideTitle: {
    fontFamily: fontFamilies.hero,
    fontSize: 38,
    lineHeight: 40,
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 1.5,
  },
  slideSubtitle: {
    fontFamily: fontFamilies.hero,
    fontSize: 32,
    lineHeight: 36,
    textAlign: 'center',
    letterSpacing: 1.5,
    marginBottom: spacing.lg,
  },
  slideDescription: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderLight,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
});
