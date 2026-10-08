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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, MessageSquare, RotateCcw, Plus } from 'lucide-react-native';
import { colors, fontFamilies, radius, spacing } from '../../theme';
import { RootStackParamList } from '../../app/navigation/types';
import { APP_CONFIG } from '../../config/app';
import { updateGymProfile } from '../../services/gym';
import { formatWhatsAppMessage } from '../../utils/whatsapp';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useGymStore } from '../../store/useGymStore';
import { haptic } from '../../utils/haptics';

type WhatsAppTemplateNavProp = NativeStackNavigationProp<RootStackParamList>;

export const WhatsAppTemplateScreen: React.FC = () => {
  const navigation = useNavigation<WhatsAppTemplateNavProp>();
  const { gym, loadGymData } = useGymStore();

  const [template, setTemplate] = useState(
    gym?.reminderTemplate || APP_CONFIG.DEFAULT_REMINDER_TEMPLATE
  );
  const [loading, setLoading] = useState(false);

  const TOKENS = [
    { label: '{name}', desc: 'Member Name' },
    { label: '{gym}', desc: 'Gym Name' },
    { label: '{expiry}', desc: 'Expiry Date' },
    { label: '{amount}', desc: 'Plan Fee' },
    { label: '{upi_link}', desc: 'UPI Payment Link' },
  ];

  const handleInsertToken = (token: string) => {
    haptic.light();
    setTemplate((prev) => `${prev} ${token}`);
  };

  const handleResetDefault = () => {
    haptic.medium();
    setTemplate(APP_CONFIG.DEFAULT_REMINDER_TEMPLATE);
  };

  const handleSave = async () => {
    if (!gym?.ownerUid) return;
    setLoading(true);
    try {
      await updateGymProfile(gym.ownerUid, {
        reminderTemplate: template.trim(),
      });
      await loadGymData(gym.ownerUid);
      haptic.success();
      Alert.alert('Saved', 'WhatsApp reminder template updated.');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update template.');
      haptic.error();
    } finally {
      setLoading(false);
    }
  };

  // Generate live sample preview
  const livePreview = formatWhatsAppMessage({
    template,
    name: 'Rahul Sharma',
    gym: gym?.gymName || 'Iron Fortress Gym',
    expiry: '25 Sep 2026',
    amount: '₹1,500',
    upiLink: 'upi://pay?pa=owner@okhdfcbank&pn=Gym&am=1500&cu=INR',
  });

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>WHATSAPP TEMPLATE</Text>

        <TouchableOpacity onPress={handleResetDefault} style={styles.resetButton}>
          <RotateCcw size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtext}>
          Customize the message sent to members when reminding them of fee renewals.
        </Text>

        {/* Token Chips */}
        <View style={styles.tokenSection}>
          <Text style={styles.tokenHeading}>TAP TO INSERT PLACEHOLDER:</Text>
          <View style={styles.tokenChipsWrap}>
            {TOKENS.map((t) => (
              <TouchableOpacity
                key={t.label}
                onPress={() => handleInsertToken(t.label)}
                style={styles.tokenChip}
              >
                <Plus size={12} color={colors.primary} />
                <Text style={styles.tokenChipText}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Template Input */}
        <Card style={styles.card}>
          <Input
            label="MESSAGE TEMPLATE"
            value={template}
            onChangeText={setTemplate}
            multiline
            numberOfLines={6}
            inputStyle={styles.templateInput}
          />
        </Card>

        {/* Live Preview Card */}
        <Card style={styles.previewCard} activeBorderColor={colors.whatsapp}>
          <View style={styles.previewHeader}>
            <MessageSquare size={16} color={colors.whatsapp} />
            <Text style={styles.previewTitle}>LIVE MESSAGE PREVIEW</Text>
          </View>
          <View style={styles.previewBubble}>
            <Text style={styles.previewText}>{livePreview}</Text>
          </View>
        </Card>

        <Button
          title="SAVE TEMPLATE"
          onPress={handleSave}
          loading={loading}
          variant="primary"
          style={styles.saveBtn}
        />
      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
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
  resetButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.massive,
  },
  subtext: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  tokenSection: {
    marginBottom: spacing.md,
  },
  tokenHeading: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  tokenChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tokenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderAccent,
  },
  tokenChipText: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 11,
    color: colors.primary,
    marginLeft: 4,
  },
  card: {
    marginBottom: spacing.lg,
  },
  templateInput: {
    height: 120,
    textAlignVertical: 'top',
    fontSize: 14,
    lineHeight: 20,
  },
  previewCard: {
    marginBottom: spacing.xl,
    padding: spacing.md,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  previewTitle: {
    fontFamily: fontFamilies.heading,
    fontSize: 14,
    color: colors.whatsapp,
    marginLeft: 6,
    letterSpacing: 0.8,
  },
  previewBubble: {
    backgroundColor: '#075E5420',
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: `${colors.whatsapp}30`,
  },
  previewText: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  saveBtn: {
    marginTop: spacing.xs,
  },
});
