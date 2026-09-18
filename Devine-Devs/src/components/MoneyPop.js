// MoneyPop — the "money just landed" moment.
//
// Shown when a money alert arrives via realtime (driver: "Earnings added to
// your wallet" after a trip completes, "Withdrawal paid" after a withdraw;
// restaurant: "Payout successful"). Pure presentation: the caller decides
// which alert to show and what to do on dismiss (mark it read). Nothing
// here computes money — the amount is parsed from the alert the DB wrote,
// which was itself computed by the payout trigger, so the number matches
// admin's ledger and the wallet balance exactly.
//
// Animation is plain Animated (no extra deps): card scales/fades in, the
// amount counts up from 0, a few soft "coins" drift upward and fade.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ONB_COLORS, ONB_FONTS } from '../onboarding/onboardingTokens';

const C = {
  primary: ONB_COLORS.primary,
  ink: '#122A1F',
  body: '#6B7F75',
  paleGreen: '#E7F1EB',
  card: '#FFFFFF',
  overlay: 'rgba(18, 42, 31, 0.55)',
};

// Pull "R508.75" / "R 1 221" / "508.75" out of an alert message.
export function parseAmountFromAlert(alert) {
  const text = `${alert?.title ?? ''} ${alert?.message ?? ''}`;
  const match = text.match(/R\s?([\d\s,]+(?:\.\d{1,2})?)/i) ?? text.match(/(\d[\d\s,]*(?:\.\d{1,2})?)/);
  if (!match) return null;
  const n = Number(String(match[1]).replace(/[\s,]/g, ''));
  return Number.isFinite(n) ? n : null;
}

const formatZAR = (n) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 2 }).format(n ?? 0);

function Coin({ delay, left }) {
  const y = useRef(new Animated.Value(0)).current;
  const o = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(y, { toValue: -90, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(o, { toValue: 1, duration: 250, useNativeDriver: true }),
          Animated.timing(o, { toValue: 0, duration: 900, delay: 250, useNativeDriver: true }),
        ]),
      ]),
    ]).start();
  }, [delay, y, o]);
  return (
    <Animated.View style={[styles.coin, { left, opacity: o, transform: [{ translateY: y }] }]}>
      <Ionicons name="cash" size={18} color={C.primary} />
    </Animated.View>
  );
}

export default function MoneyPop({ visible, amount, title, subtitle, ctaLabel = 'Nice', onDismiss }) {
  const scale = useRef(new Animated.Value(0.8)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const counter = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!visible) return;
    scale.setValue(0.8);
    fade.setValue(0);
    counter.setValue(0);
    const sub = counter.addListener(({ value }) => setShown(value));
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(counter, { toValue: amount ?? 0, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
    ]).start();
    return () => counter.removeListener(sub);
  }, [visible, amount, scale, fade, counter]);

  const coins = useMemo(() => [0, 120, 240, 360, 480].map((d, i) => ({ delay: d, left: 30 + i * 44 })), []);

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { opacity: fade, transform: [{ scale }] }]}>
          <View style={styles.coinField} pointerEvents="none">
            {coins.map((c, i) => <Coin key={i} delay={c.delay} left={c.left} />)}
          </View>
          <View style={styles.iconWrap}>
            <Ionicons name="wallet" size={30} color={C.primary} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.amount}>{amount != null ? formatZAR(shown) : ''}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <Pressable style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]} onPress={onDismiss}>
            <Text style={styles.ctaText}>{ctaLabel}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: C.overlay, alignItems: 'center', justifyContent: 'center', padding: 28 },
  card: {
    width: '100%', maxWidth: 340, backgroundColor: C.card, borderRadius: 24, padding: 24, alignItems: 'center',
    shadowColor: '#122A1F', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 12,
  },
  coinField: { position: 'absolute', top: 40, left: 0, right: 0, height: 60 },
  coin: { position: 'absolute', top: 30 },
  iconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.paleGreen, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  title: { fontFamily: ONB_FONTS.bold, fontSize: 16, color: C.body, textAlign: 'center' },
  amount: { fontFamily: ONB_FONTS.extraBold, fontSize: 34, color: C.primary, marginTop: 6, letterSpacing: -0.5 },
  subtitle: { fontFamily: ONB_FONTS.medium, fontSize: 13, color: C.body, textAlign: 'center', marginTop: 8, lineHeight: 19 },
  cta: { marginTop: 20, backgroundColor: C.primary, paddingVertical: 12, paddingHorizontal: 32, borderRadius: 30 },
  ctaText: { fontFamily: ONB_FONTS.bold, color: '#fff', fontSize: 14 },
});
