import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { colors, radius, spacing, fontFamilies, shadows } from '../theme';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react-native';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmTitle: string;
  cancelTitle?: string;
  onConfirm: () => void;
  onCancel: () => void;
  secondaryTitle?: string;
  onSecondary?: () => void;
  isDanger?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmTitle,
  cancelTitle = 'CANCEL',
  onConfirm,
  onCancel,
  secondaryTitle,
  onSecondary,
  isDanger = false,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.dialogCard}>
          <View style={styles.iconCircle}>
            <AlertTriangle
              size={28}
              color={isDanger ? colors.danger : colors.secondary}
            />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonStack}>
            <Button
              title={confirmTitle}
              onPress={onConfirm}
              variant={isDanger ? 'danger' : 'primary'}
              style={styles.actionBtn}
            />

            {secondaryTitle && onSecondary && (
              <Button
                title={secondaryTitle}
                onPress={onSecondary}
                variant="outline"
                style={styles.actionBtn}
              />
            )}

            <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>{cancelTitle}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.backdrop,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  dialogCard: {
    width: '100%',
    backgroundColor: colors.elevated,
    borderRadius: radius.cardLarge,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderTopColor: colors.glassHighlight,
    ...shadows.cardElevated,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.glassPill,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopColor: colors.glassBorderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fontFamilies.heading,
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  message: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  buttonStack: {
    width: '100%',
  },
  actionBtn: {
    marginBottom: spacing.sm,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  cancelText: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 14,
    color: colors.textMuted,
    letterSpacing: 0.2,
  },
});
