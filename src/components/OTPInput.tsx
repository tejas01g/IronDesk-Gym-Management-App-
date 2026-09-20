import React, { useRef, useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  NativeSyntheticEvent,
} from 'react-native';
import { colors, radius, spacing, fontFamilies } from '../theme';
import { haptic } from '../utils/haptics';

interface OTPInputProps {
  length?: number;
  onComplete: (code: string) => void;
  onChangeCode?: (code: string) => void;
  disabled?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  onComplete,
  onChangeCode,
  disabled = false,
}) => {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(''));
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const inputsRef = useRef<any[]>([]);

  const handleChangeText = (text: string, index: number) => {
    if (disabled) return;

    // Handle full OTP paste
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length > 1) {
      const newDigits = [...digits];
      for (let i = 0; i < length; i++) {
        newDigits[i] = cleaned[i] || '';
      }
      setDigits(newDigits);
      const code = newDigits.join('');
      onChangeCode?.(code);
      if (code.length === length) {
        haptic.success();
        onComplete(code);
        inputsRef.current[length - 1]?.focus();
      }
      return;
    }

    // Single digit input
    const singleChar = cleaned.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = singleChar;
    setDigits(newDigits);

    const code = newDigits.join('');
    onChangeCode?.(code);

    if (singleChar) {
      haptic.light();
      if (index < length - 1) {
        inputsRef.current[index + 1]?.focus();
      } else if (code.length === length) {
        haptic.success();
        onComplete(code);
      }
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<any>,
    index: number
  ) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (digits[index] === '' && index > 0) {
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
        onChangeCode?.(newDigits.join(''));
        inputsRef.current[index - 1]?.focus();
      }
    }
  };

  return (
    <View style={styles.container}>
      {Array.from({ length }).map((_, index) => {
        const isFocused = focusedIndex === index;
        const isFilled = Boolean(digits[index]);

        return (
          <TextInput
            key={index}
            ref={(ref) => {
              inputsRef.current[index] = ref;
            }}
            style={[
              styles.box,
              isFocused && styles.boxFocused,
              isFilled && styles.boxFilled,
              disabled && styles.boxDisabled,
            ]}
            value={digits[index]}
            onChangeText={(text) => handleChangeText(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            onFocus={() => setFocusedIndex(index)}
            keyboardType="number-pad"
            maxLength={index === 0 ? length : 1}
            selectTextOnFocus
            editable={!disabled}
            textAlign="center"
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: spacing.lg,
  },
  box: {
    width: 48,
    height: 58,
    borderRadius: radius.card,
    backgroundColor: colors.inputBackground,
    borderWidth: 1.5,
    borderColor: colors.border,
    color: colors.primary,
    fontFamily: fontFamilies.heading,
    fontSize: 28,
    textAlign: 'center',
    padding: 0,
  },
  boxFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  boxFilled: {
    borderColor: colors.borderLight,
    color: colors.text,
  },
  boxDisabled: {
    opacity: 0.5,
  },
});
