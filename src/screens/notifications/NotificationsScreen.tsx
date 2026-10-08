import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  Bell,
  Clock,
  AlertTriangle,
  MessageSquare,
  CreditCard,
  CheckCircle2,
} from 'lucide-react-native';
import { colors, fontFamilies, radius, spacing } from '../../theme';
import { RootStackParamList } from '../../app/navigation/types';
import { Member } from '../../types/models';
import { getExpiringMembers, getOverdueMembers } from '../../services/members';
import { formatDate } from '../../utils/dates';
import { formatINR } from '../../utils/money';
import { getExpiryCountdownText } from '../../utils/memberStatus';
import { openWhatsApp, formatWhatsAppMessage } from '../../utils/whatsapp';
import { generateUpiUrl } from '../../utils/upi';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { useGymStore } from '../../store/useGymStore';
import { haptic } from '../../utils/haptics';

type NotificationsNavProp = NativeStackNavigationProp<RootStackParamList>;

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation<NotificationsNavProp>();
  const { gym } = useGymStore();

  const [expiringMembers, setExpiringMembers] = useState<Member[]>([]);
  const [overdueMembers, setOverdueMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gym?.ownerUid) return;
    Promise.all([
      getExpiringMembers(gym.ownerUid, 20),
      getOverdueMembers(gym.ownerUid, 20),
    ])
      .then(([exp, ov]) => {
        setExpiringMembers(exp);
        setOverdueMembers(ov);
      })
      .finally(() => setLoading(false));
  }, [gym?.ownerUid]);

  const handleSendReminder = async (member: Member) => {
    haptic.medium();
    const upiLink = generateUpiUrl({
      upiId: gym?.upiId || '',
      name: gym?.gymName || 'Gym',
      amount: member.planPrice || 1000,
      note: 'Gym Fee Renewal',
    });

    const template = gym?.reminderTemplate || '';
    const message = formatWhatsAppMessage({
      template,
      name: member.name,
      gym: gym?.gymName || 'Our Gym',
      expiry: formatDate(member.expiryDate),
      amount: formatINR(member.planPrice),
      upiLink,
    });

    await openWhatsApp(member.phone, message);
  };

  const totalAlerts = expiringMembers.length + overdueMembers.length;

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

        <Text style={styles.headerTitle}>NOTIFICATIONS</Text>

        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Trial Status Card */}
        {gym?.planStatus === 'trial' && (
          <Card style={styles.trialCard} activeBorderColor={colors.primary}>
            <View style={styles.alertRow}>
              <Bell size={20} color={colors.primary} />
              <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                <Text style={styles.alertTitle}>FREE TRIAL PERIOD ACTIVE</Text>
                <Text style={styles.alertSub}>
                  Enjoy full access. Lock in your founder pass anytime from settings.
                </Text>
              </View>
            </View>
          </Card>
        )}

        {totalAlerts === 0 && !loading ? (
          <EmptyState
            icon={CheckCircle2}
            title="ALL CAUGHT UP"
            description="No members are expiring or overdue at the moment. Your register is clean!"
          />
        ) : (
          <>
            {/* Overdue Alerts */}
            {overdueMembers.map((m) => (
              <Card
                key={m.id}
                style={styles.alertCard}
                activeBorderColor={colors.danger}
              >
                <View style={styles.alertRow}>
                  <AlertTriangle size={20} color={colors.danger} />
                  <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                    <Text style={styles.alertTitle}>{m.name.toUpperCase()} IS OVERDUE</Text>
                    <Text style={styles.alertSub}>
                      {m.planName} • {getExpiryCountdownText(m.expiryDate)}
                    </Text>
                  </View>
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    onPress={() => handleSendReminder(m)}
                    style={styles.remindBtn}
                  >
                    <MessageSquare size={14} color={colors.whatsapp} />
                    <Text style={styles.remindBtnText}>WHATSAPP</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('CollectFee', { memberId: m.id, member: m })
                    }
                    style={styles.collectBtn}
                  >
                    <CreditCard size={14} color={colors.black} />
                    <Text style={styles.collectBtnText}>COLLECT FEE</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))}

            {/* Expiring Soon Alerts */}
            {expiringMembers.map((m) => (
              <Card
                key={m.id}
                style={styles.alertCard}
                activeBorderColor={colors.secondary}
              >
                <View style={styles.alertRow}>
                  <Clock size={20} color={colors.secondary} />
                  <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                    <Text style={styles.alertTitle}>
                      {m.name.toUpperCase()} EXPIRES SOON
                    </Text>
                    <Text style={styles.alertSub}>
                      {m.planName} • {getExpiryCountdownText(m.expiryDate)}
                    </Text>
                  </View>
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    onPress={() => handleSendReminder(m)}
                    style={styles.remindBtn}
                  >
                    <MessageSquare size={14} color={colors.whatsapp} />
                    <Text style={styles.remindBtnText}>WHATSAPP</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('CollectFee', { memberId: m.id, member: m })
                    }
                    style={styles.collectBtn}
                  >
                    <CreditCard size={14} color={colors.black} />
                    <Text style={styles.collectBtnText}>RENEW</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </>
        )}
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
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  trialCard: {
    marginBottom: spacing.md,
  },
  alertCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertTitle: {
    fontFamily: fontFamilies.heading,
    fontSize: 16,
    color: colors.text,
    letterSpacing: 0.5,
  },
  alertSub: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: spacing.sm,
  },
  remindBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: `${colors.whatsapp}40`,
  },
  remindBtnText: {
    fontFamily: fontFamilies.heading,
    fontSize: 11,
    color: colors.whatsapp,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  collectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  collectBtnText: {
    fontFamily: fontFamilies.heading,
    fontSize: 11,
    color: colors.black,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
});
