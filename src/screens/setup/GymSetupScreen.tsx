import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Dumbbell, Plus, Trash2, CheckCircle2 } from 'lucide-react-native';
import { colors, fontFamilies, radius, spacing } from '../../theme';
import { RootStackParamList } from '../../app/navigation/types';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { isValidName, isValidUpiId } from '../../utils/validators';
import { createGymWithPlans, InitialPlanInput } from '../../services/gym';
import { useAuthStore } from '../../store/useAuthStore';
import { useGymStore } from '../../store/useGymStore';
import { APP_CONFIG } from '../../config/app';
import { haptic } from '../../utils/haptics';

type GymSetupNavProp = NativeStackNavigationProp<RootStackParamList, 'GymSetup'>;

export const GymSetupScreen: React.FC = () => {
  const navigation = useNavigation<GymSetupNavProp>();
  const user = useAuthStore((s) => s.user);
  const loadGymData = useGymStore((s) => s.loadGymData);

  const [gymName, setGymName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [city, setCity] = useState('');
  const [upiId, setUpiId] = useState('');

  const [plans, setPlans] = useState<InitialPlanInput[]>([
    ...APP_CONFIG.DEFAULT_PLANS,
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleAddPlan = () => {
    haptic.light();
    setPlans((prev) => [
      ...prev,
      { name: 'New Plan', durationDays: 30, price: 1000 },
    ]);
  };

  const handleUpdatePlan = (
    index: number,
    field: keyof InitialPlanInput,
    value: string | number
  ) => {
    setPlans((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  };

  const handleRemovePlan = (index: number) => {
    if (plans.length <= 1) {
      Alert.alert('At least one plan required', 'Your gym must have at least 1 membership plan.');
      return;
    }
    haptic.medium();
    setPlans((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!isValidName(gymName)) {
      errs.gymName = 'Gym name must be at least 2 characters';
    }
    if (!isValidName(ownerName)) {
      errs.ownerName = 'Owner name must be at least 2 characters';
    }
    if (!isValidName(city)) {
      errs.city = 'City is required';
    }
    if (!isValidUpiId(upiId)) {
      errs.upiId = 'Enter a valid UPI ID (e.g., yourname@okaxis, 9876543210@paytm)';
    }

    if (plans.length === 0) {
      errs.plans = 'Add at least one membership plan';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveGym = async () => {
    if (!validate()) {
      haptic.error();
      return;
    }

    if (!user) {
      Alert.alert('Session expired', 'Please login again.');
      navigation.replace('Login');
      return;
    }

    setLoading(true);
    try {
      await createGymWithPlans(
        user.uid,
        {
          gymName,
          ownerName,
          phone: user.phoneNumber || '',
          city,
          upiId,
        },
        plans
      );

      await loadGymData(user.uid);
      haptic.success();
      navigation.replace('ChoosePlan');
    } catch (error: any) {
      console.warn('[GymSetup] Batched write error:', error);
      Alert.alert('Setup Failed', error?.message || 'Failed to save gym details. Please try again.');
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Dumbbell size={32} color={colors.primary} />
          </View>
          <Text style={styles.title}>GYM REGISTRATION</Text>
          <Text style={styles.subtitle}>
            Set up your gym profile and membership packages. All saved in one atomic operation.
          </Text>
        </View>

        {/* Form Inputs */}
        <Card style={styles.cardSection}>
          <Text style={styles.sectionHeader}>GYM DETAILS</Text>

          <Input
            label="GYM NAME"
            value={gymName}
            onChangeText={(text) => {
              setGymName(text);
              if (errors.gymName) setErrors((prev) => ({ ...prev, gymName: '' }));
            }}
            placeholder="e.g. Iron Fortress Gym"
            error={errors.gymName}
          />

          <Input
            label="OWNER NAME"
            value={ownerName}
            onChangeText={(text) => {
              setOwnerName(text);
              if (errors.ownerName) setErrors((prev) => ({ ...prev, ownerName: '' }));
            }}
            placeholder="e.g. Vikram Singh"
            error={errors.ownerName}
          />

          <Input
            label="CITY"
            value={city}
            onChangeText={(text) => {
              setCity(text);
              if (errors.city) setErrors((prev) => ({ ...prev, city: '' }));
            }}
            placeholder="e.g. Delhi, Mumbai, Pune"
            error={errors.city}
          />

          <Input
            label="YOUR UPI ID FOR RECEIVING FEES"
            value={upiId}
            onChangeText={(text) => {
              setUpiId(text.trim());
              if (errors.upiId) setErrors((prev) => ({ ...prev, upiId: '' }));
            }}
            placeholder="e.g. vikram@okaxis or 9876543210@paytm"
            autoCapitalize="none"
            error={errors.upiId}
          />
        </Card>

        {/* Membership Plans Section */}
        <Card style={styles.cardSection}>
          <View style={styles.plansHeaderRow}>
            <Text style={styles.sectionHeader}>MEMBERSHIP PLANS</Text>
            <TouchableOpacity
              onPress={handleAddPlan}
              style={styles.addPlanButton}
              activeOpacity={0.8}
            >
              <Plus size={16} color={colors.primary} />
              <Text style={styles.addPlanText}>ADD PLAN</Text>
            </TouchableOpacity>
          </View>

          {plans.map((plan, index) => (
            <View key={index} style={styles.planItemCard}>
              <View style={styles.planTopRow}>
                <Text style={styles.planIndexText}>PLAN #{index + 1}</Text>
                {plans.length > 1 && (
                  <TouchableOpacity
                    onPress={() => handleRemovePlan(index)}
                    style={styles.deletePlanButton}
                  >
                    <Trash2 size={16} color={colors.danger} />
                  </TouchableOpacity>
                )}
              </View>

              <Input
                label="PLAN NAME"
                value={plan.name}
                onChangeText={(text) => handleUpdatePlan(index, 'name', text)}
                placeholder="e.g. 1 Month Regular"
                containerStyle={styles.planInput}
              />

              <View style={styles.planRow}>
                <View style={styles.halfWidth}>
                  <Input
                    label="DAYS"
                    value={String(plan.durationDays)}
                    onChangeText={(text) =>
                      handleUpdatePlan(
                        index,
                        'durationDays',
                        parseInt(text.replace(/\D/g, ''), 10) || 0
                      )
                    }
                    placeholder="30"
                    keyboardType="number-pad"
                    containerStyle={styles.planInput}
                  />
                </View>

                <View style={styles.halfWidth}>
                  <Input
                    label="PRICE (₹)"
                    value={String(plan.price)}
                    onChangeText={(text) =>
                      handleUpdatePlan(
                        index,
                        'price',
                        parseInt(text.replace(/\D/g, ''), 10) || 0
                      )
                    }
                    placeholder="1000"
                    keyboardType="number-pad"
                    containerStyle={styles.planInput}
                  />
                </View>
              </View>
            </View>
          ))}
        </Card>

        {/* Bottom CTA */}
        <Button
          title="COMPLETE SETUP & PROCEED"
          onPress={handleSaveGym}
          loading={loading}
          variant="primary"
          style={styles.saveButton}
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
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconCircle: {
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
  cardSection: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    fontFamily: fontFamilies.heading,
    fontSize: 18,
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: spacing.lg,
  },
  plansHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  addPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
  },
  addPlanText: {
    fontFamily: fontFamilies.heading,
    fontSize: 13,
    color: colors.primary,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  planItemCard: {
    backgroundColor: colors.inputBackground,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  planTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  planIndexText: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  deletePlanButton: {
    padding: 4,
  },
  planInput: {
    marginBottom: spacing.sm,
  },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  saveButton: {
    marginTop: spacing.md,
  },
});
