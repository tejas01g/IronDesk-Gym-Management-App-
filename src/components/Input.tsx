import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, radius, spacing, fontFamilies } from '../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  prefix,
  suffix,
  containerStyle,
  inputStyle,
  onFocus,
  onBlur,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          Boolean(error) && styles.inputError,
        ]}
      >
        {prefix ? <View style={styles.prefixContainer}>{prefix}</View> : null}
        <TextInput
          style={[styles.input, inputStyle]}
          placeholderTextColor={colors.textDisabled}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {suffix ? <View style={styles.suffixContainer}>{suffix}</View> : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
    width: '100%',
  },
  label: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    letterSpacing: 0.2,
  },
  inputContainer: {
    height: 52,
    backgroundColor: colors.inputBackground,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopColor: colors.glassBorderLight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    borderTopColor: colors.primary,
  },
  inputError: {
    borderColor: colors.danger,
    borderTopColor: colors.danger,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 15,
    height: '100%',
  },
  prefixContainer: {
    marginRight: spacing.sm,
    justifyContent: 'center',
  },
  suffixContainer: {
    marginLeft: spacing.sm,
    justifyContent: 'center',
  },
  errorText: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 12,
    color: colors.danger,
    marginTop: spacing.xs,
  },
});
