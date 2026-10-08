import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Building2,
  ListOrdered,
  MessageSquare,
  Crown,
  HelpCircle,
  LogOut,
  ChevronRight,
  Edit2,
  X,
  ShieldCheck,
} from 'lucide-react-native';
import { colors, fontFamilies, radius, spacing } from '../../theme';
import { RootStackParamList } from '../../app/navigation/types';
import { APP_CONFIG } from '../../config/app';
import { updateGymProfile } from '../../services/gym';
import { openWhatsApp } from '../../utils/whatsapp';
import { formatDate } from '../../utils/dates';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useGymStore } from '../../store/useGymStore';
import { useAuthStore } from '../../store/useAuthStore';
import { haptic } from '../../utils/haptics';

type SettingsNavProp = NativeStackNavigationProp<RootStackParamList>;

export const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<SettingsNavProp>();
  const { gym, loadGymData } = useGymStore();
  const logout = useAuthStore((s) => s.logout);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [gymName, setGymName] = useState(gym?.gymName || '');
  const [ownerName, setOwnerName] = useState(gym?.ownerName || '');
  const [city, setCity] = useState(gym?.city || '');
  const [upiId, setUpiId] = useState(gym?.upiId || '');
  const [saving, setSaving] = useState(false);

  const openProfileModal = () => {
    haptic.light();
    setGymName(gym?.gymName || '');
    setOwnerName(gym?.ownerName || '');
    setCity(gym?.city || '');
    setUpiId(gym?.upiId || '');
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!gym?.ownerUid) return;
    setSaving(true);
    try {
      await updateGymProfile(gym.ownerUid, {
        gymName: gymName.trim(),
        ownerName: ownerName.trim(),
        city: city.trim(),
        upiId: upiId.trim(),
      });
      await loadGymData(gym.ownerUid);
      haptic.success();
      setEditModalVisible(false);
    } catch (e: any) {
      Alert.alert('Update Failed', e?.message || 'Failed to update profile.');
      haptic.error();
    } finally {
      setSaving(false);
    }
  };

  const handleSupport = async () => {
    haptic.light();
    await openWhatsApp(
      APP_CONFIG.DEVELOPER_WHATSAPP,
      `Hi IronDesk Team, I have a question regarding my gym "${gym?.gymName || 'Gym'}".`
    );
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of your gym register?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          haptic.medium();
          await logout();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        },
      },
    ]);
  };

  const planStatusLabel = gym?.planStatus?.toUpperCase() || 'TRIAL';

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>SETTINGS</Text>
        <Text style={styles.subtitle}>GYM PROFILE & PREFERENCES</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 110 + insets.bottom },
        ]}
      >
        {/* Gym Profile Summary Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.gymIconCircle}>
              <Building2 size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.gymNameText}>{gym?.gymName || 'IronDesk Gym'}</Text>
              <Text style={styles.ownerText}>Owner: {gym?.ownerName || 'Admin'}</Text>
              <Text style={styles.detailText}>
                {gym?.city} • {gym?.phone}
              </Text>
              <Text style={styles.upiText}>
                UPI: <Text style={styles.upiBold}>{gym?.upiId}</Text>
              </Text>
            </View>
            <TouchableOpacity onPress={openProfileModal} style={styles.editIconBtn}>
              <Edit2 size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Subscription Pass Card */}
        <Card style={styles.subscriptionCard} activeBorderColor={colors.founderGold}>
          <View style={styles.subscriptionRow}>
            <View style={styles.subLeft}>
              <View style={styles.crownRow}>
                <Crown size={16} color={colors.founderGold} />
                <Text style={styles.subStatusBadge}>{planStatusLabel}</Text>
              </View>
              <Text style={styles.subTitle}>
                {gym?.planStatus === 'trial'
                  ? '30-Day Free Trial'
                  : 'Founder Annual Pass'}
              </Text>
              {gym?.trialEndsAt && (
                <Text style={styles.subExpiry}>
                  Valid until: {formatDate(gym.trialEndsAt)}
                </Text>
              )}
            </View>

            <TouchableOpacity
              onPress={() => {
                haptic.medium();
                navigation.navigate('ChoosePlan');
              }}
              style={styles.renewPlanBtn}
            >
              <Text style={styles.renewPlanText}>UPGRADE</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Navigation Menu Options */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>APP CONFIGURATION</Text>

          {/* Manage Membership Plans */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              haptic.light();
              navigation.navigate('ManagePlans');
            }}
            activeOpacity={0.8}
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIconBox}>
                <ListOrdered size={18} color={colors.primary} />
              </View>
              <View style={{ marginLeft: spacing.md }}>
                <Text style={styles.menuItemTitle}>Membership Plans</Text>
                <Text style={styles.menuItemSub}>Add, edit durations and prices</Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.borderLight} />
          </TouchableOpacity>

          {/* WhatsApp Reminder Template */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              haptic.light();
              navigation.navigate('WhatsAppTemplateEditor');
            }}
            activeOpacity={0.8}
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIconBox}>
                <MessageSquare size={18} color={colors.whatsapp} />
              </View>
              <View style={{ marginLeft: spacing.md }}>
                <Text style={styles.menuItemTitle}>WhatsApp Reminder Template</Text>
                <Text style={styles.menuItemSub}>Personalize renewal messages</Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.borderLight} />
          </TouchableOpacity>
        </View>

        {/* Support & Help */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>SUPPORT & ACCOUNT</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleSupport}
            activeOpacity={0.8}
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIconBox}>
                <HelpCircle size={18} color={colors.info} />
              </View>
              <View style={{ marginLeft: spacing.md }}>
                <Text style={styles.menuItemTitle}>Contact Developer Support</Text>
                <Text style={styles.menuItemSub}>Direct WhatsApp assistance</Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.borderLight} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.logoutItem]}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBox, styles.logoutIconBox]}>
                <LogOut size={18} color={colors.danger} />
              </View>
              <Text style={styles.logoutText}>Log Out</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.versionFooter}>
          <ShieldCheck size={14} color={colors.textMuted} />
          <Text style={styles.versionText}>IronDesk MVP 1.0 • Built for Gym Owners</Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>EDIT GYM PROFILE</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <X size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Input label="GYM NAME" value={gymName} onChangeText={setGymName} />
            <Input label="OWNER NAME" value={ownerName} onChangeText={setOwnerName} />
            <Input label="CITY" value={city} onChangeText={setCity} />
            <Input label="OWNER UPI ID" value={upiId} onChangeText={setUpiId} />

            <Button
              title="SAVE CHANGES"
              onPress={handleSaveProfile}
              loading={saving}
              variant="primary"
              style={{ marginTop: spacing.md }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  title: {
    fontFamily: fontFamilies.heading,
    fontSize: 28,
    color: colors.text,
    letterSpacing: 1.2,
  },
  subtitle: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 1,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 110,
  },
  profileCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gymIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gymNameText: {
    fontFamily: fontFamilies.heading,
    fontSize: 20,
    color: colors.text,
    letterSpacing: 0.8,
  },
  ownerText: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 1,
  },
  detailText: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 12,
    color: colors.textMuted,
  },
  upiText: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  upiBold: {
    color: colors.primary,
    fontFamily: fontFamilies.bodyBold,
  },
  editIconBtn: {
    padding: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.inputBackground,
  },
  subscriptionCard: {
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  subscriptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  crownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  subStatusBadge: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 11,
    color: colors.founderGold,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  subTitle: {
    fontFamily: fontFamilies.heading,
    fontSize: 18,
    color: colors.text,
  },
  subExpiry: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 12,
    color: colors.textMuted,
  },
  renewPlanBtn: {
    backgroundColor: colors.founderGold,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  renewPlanText: {
    fontFamily: fontFamilies.heading,
    fontSize: 12,
    color: colors.black,
    letterSpacing: 0.5,
  },
  menuSection: {
    marginBottom: spacing.lg,
  },
  menuSectionTitle: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
    paddingLeft: spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.card,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemTitle: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 14,
    color: colors.text,
  },
  menuItemSub: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 12,
    color: colors.textMuted,
  },
  logoutItem: {
    borderColor: `${colors.danger}40`,
  },
  logoutIconBox: {
    backgroundColor: `${colors.danger}15`,
  },
  logoutText: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 14,
    color: colors.danger,
    marginLeft: spacing.md,
  },
  versionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  versionText: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.backdrop,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.cardLarge,
    borderTopRightRadius: radius.cardLarge,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontFamily: fontFamilies.heading,
    fontSize: 22,
    color: colors.text,
    letterSpacing: 1,
  },
});
