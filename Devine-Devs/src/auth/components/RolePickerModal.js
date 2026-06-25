// Role-selection pop-up (presentational only — NO auth or navigation logic).
//
// Built on React Native's built-in <Modal> (no bottom-sheet library) to match the
// approved "BioLoop Auth Flow" design: a dimmed background with a slide-up sheet
// showing the three roles as cards. Tapping a card highlights it; the "Continue
// as <Role>" button commits the choice via onSelect.
//
// Props:
//   visible  — whether the sheet is shown
//   role     — the currently committed role key (or null)
//   roles    — [{ key, label, icon, desc }] (keys come from the screen's ROLES)
//   onSelect(key) — called with the chosen role key when "Continue" is pressed
//   onClose  — called when the user dismisses the sheet (backdrop / Android back)

import React, { useEffect, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AUTH_COLORS, AUTH_FONTS, AUTH_BUTTON_SHADOW } from '../authTheme';

export default function RolePickerModal({ visible, role, roles, onSelect, onClose }) {
  // Local highlight only — the committed role still lives in the parent (single
  // source of truth). Re-sync to the parent's role each time the sheet opens.
  const [pending, setPending] = useState(role);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) setPending(role);
  }, [visible, role]);

  const selected = roles.find((r) => r.key === pending);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        {/* Dimmed background — tap to dismiss */}
        <Pressable style={styles.overlay} onPress={onClose} />

        {/* Slide-up sheet */}
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 28 }]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>Join the loop</Text>
            <Text style={styles.subtitle}>Choose how you'll use BioLoop.</Text>
          </View>

          <View style={styles.cards}>
            {roles.map((r) => {
              const isSel = pending === r.key;
              const dim = pending != null && !isSel;
              return (
                <Pressable
                  key={r.key}
                  style={[styles.card, isSel && styles.cardSelected, dim && styles.cardDim]}
                  onPress={() => setPending(r.key)}
                >
                  <View style={[styles.iconCircle, isSel && styles.iconCircleSelected]}>
                    <Ionicons
                      name={r.icon}
                      size={23}
                      color={isSel ? AUTH_COLORS.white : AUTH_COLORS.primary}
                    />
                  </View>
                  <View style={styles.cardText}>
                    <Text style={[styles.cardTitle, isSel && styles.cardTitleSelected]}>
                      {r.label}
                    </Text>
                    <Text style={styles.cardDesc}>{r.desc}</Text>
                  </View>
                  {isSel ? (
                    <View style={styles.check}>
                      <Ionicons name="checkmark" size={16} color={AUTH_COLORS.white} />
                    </View>
                  ) : (
                    <Ionicons name="chevron-forward" size={20} color={AUTH_COLORS.chevron} />
                  )}
                </Pressable>
              );
            })}
          </View>

          {selected ? (
            <Pressable style={styles.continueBtn} onPress={() => onSelect(selected.key)}>
              <Text style={styles.continueText}>Continue as {selected.label}</Text>
              <Ionicons name="arrow-forward" size={19} color={AUTH_COLORS.white} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: AUTH_COLORS.overlay,
  },
  sheet: {
    backgroundColor: AUTH_COLORS.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 22,
    paddingTop: 12,
    shadowColor: '#081811',
    shadowOpacity: 0.3,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: -20 },
    elevation: 24,
  },
  handle: {
    width: 46,
    height: 5,
    borderRadius: 3,
    backgroundColor: AUTH_COLORS.sheetHandle,
    alignSelf: 'center',
    marginBottom: 6,
  },
  header: {
    paddingHorizontal: 4,
    paddingTop: 10,
    paddingBottom: 18,
  },
  title: {
    fontFamily: AUTH_FONTS.extraBold,
    fontSize: 25,
    color: AUTH_COLORS.ink,
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: AUTH_FONTS.medium,
    fontSize: 14.5,
    color: AUTH_COLORS.body,
  },
  cards: {
    gap: 13,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    padding: 15,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: AUTH_COLORS.inputBorder,
    backgroundColor: AUTH_COLORS.white,
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: AUTH_COLORS.primary,
    backgroundColor: AUTH_COLORS.selectedBg,
    shadowColor: AUTH_COLORS.primary,
    shadowOpacity: 0.16,
    shadowRadius: 13,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  cardDim: {
    opacity: 0.55,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: AUTH_COLORS.roleCircle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleSelected: {
    backgroundColor: AUTH_COLORS.primary,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: AUTH_FONTS.bold,
    fontSize: 16.5,
    color: AUTH_COLORS.ink,
  },
  cardTitleSelected: {
    fontFamily: AUTH_FONTS.extraBold,
  },
  cardDesc: {
    fontFamily: AUTH_FONTS.medium,
    fontSize: 13,
    color: AUTH_COLORS.body,
    marginTop: 3,
    lineHeight: 17.5,
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: AUTH_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 58,
    borderRadius: 29,
    backgroundColor: AUTH_COLORS.primary,
    marginTop: 20,
    ...AUTH_BUTTON_SHADOW,
  },
  continueText: {
    fontFamily: AUTH_FONTS.bold,
    fontSize: 16,
    color: AUTH_COLORS.white,
  },
});
