import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { ONB_COLORS, ONB_FONTS } from '../../onboarding/onboardingTokens';

export default function ProfileField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = 'default',
  required = false,
  editable = true,
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          focused && styles.inputFocused,
          !editable && styles.inputDisabled,
        ]}
        value={value ?? ''}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A9B5AD"
        multiline={multiline}
        keyboardType={keyboardType}
        editable={editable}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: {
    fontSize: 13,
    fontFamily: ONB_FONTS.semiBold,
    color: '#6B7F75',
    marginBottom: 6,
  },
  required: { color: '#DC2626' },
  // Matches the auth input style: soft fill, 1.5px border, radius 18,
  // forest-green 2px border on focus.
  input: {
    backgroundColor: '#F5F8F6',
    borderWidth: 1.5,
    borderColor: '#E4EDE7',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: ONB_FONTS.medium,
    color: '#122A1F',
  },
  inputFocused: {
    borderColor: ONB_COLORS.primary,
    borderWidth: 2,
  },
  inputMultiline: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  inputDisabled: {
    opacity: 0.7,
  },
});
