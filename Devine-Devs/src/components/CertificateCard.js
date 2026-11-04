// "Environmental Partner" certificate - one component for all four roles.
//
// A star for each completed year with BioLoop, the tier that goes with it,
// and how far through the current year the partner is. Sits in the same
// place as StatementButton and takes a `tint` for the same reason: it lives
// in four differently-themed screens and must not import any one role's
// tokens.
//
// The rule for what a star is worth lives in src/lib/partnerCertificate.js,
// shared with the PDF, so the card and the certificate can never disagree.
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../AuthContext';
import { getCertificateData } from '../services/certificateService';
import { certificateHtml } from '../lib/certificateHtml';
import { exportPdf } from '../lib/documentExport';
import { getLogoDataUri } from '../lib/brandLogo';
import {
  certificateStanding,
  longDate,
  membershipLength,
} from '../lib/partnerCertificate';

const GOLD = '#B7892F';
const MUTED = '#6B7F75';
const BORDER = '#E4EDE7';
const INK = '#122A1F';

/** Up to five stars are drawn; beyond that the count is written out. */
function Stars({ count }) {
  if (count > 5) {
    return (
      <View style={styles.starRow}>
        <Ionicons name="star" size={18} color={GOLD} />
        <Text style={styles.starOverflow}>{'x ' + count}</Text>
      </View>
    );
  }
  return (
    <View style={styles.starRow}>
      {Array.from({ length: Math.max(1, count) }, (_, i) => (
        <Ionicons
          key={i}
          name={count === 0 ? 'star-outline' : 'star'}
          size={18}
          color={count === 0 ? BORDER : GOLD}
        />
      ))}
    </View>
  );
}

export default function CertificateCard({
  role,
  ownerId,
  accountName,
  tint = '#15643E',
  style,
}) {
  const { user } = useAuth();
  const userId = user?.id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setData(await getCertificateData({ userId, role, roleId: ownerId }));
    } catch {
      // A certificate is a nice-to-have on every screen it appears on.
      // Failing to load one must never take the screen down with it.
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [userId, role, ownerId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={[styles.card, style, styles.centred]}>
        <ActivityIndicator color={tint} />
      </View>
    );
  }

  if (!data?.joinedAt) return null;

  const standing = certificateStanding(data.joinedAt);
  if (!standing.valid) return null;

  const name = accountName || user?.email || 'BioLoop Partner';
  const now = new Date();

  const handleDownload = async () => {
    if (busy) return;
    setBusy(true);
    try {
      // Best-effort: null simply prints the certificate without the mark.
      const logoDataUri = await getLogoDataUri();
      await exportPdf({
        html: certificateHtml(standing, {
          accountName: name,
          role,
          litres: data.litres,
          collections: data.collections,
          co2Kg: data.co2Kg,
          joinedLabel: longDate(standing.joined),
          lengthLabel: membershipLength(standing.joined, now),
          issuedLabel: longDate(now),
          reference: ownerId ? 'BL-' + String(ownerId).slice(0, 8) : '',
          logoDataUri,
        }),
        kind: role + '-certificate',
        dialogTitle: 'Save or share your certificate',
      });
    } catch (err) {
      const message = String(err?.message ?? '');
      // Same shape as StatementButton: the PDF modules are missing from dev
      // clients built before they were added.
      if (/native module|doesn't exist|not available|cannot find/i.test(message)) {
        Alert.alert(
          'Not available in this build',
          'Downloading documents needs a newer build of the app. Open it in Expo Go, or rebuild the dev client.'
        );
      } else {
        Alert.alert('Could not create the certificate', message || 'Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <View style={styles.seal}>
          <Ionicons name="leaf" size={16} color={tint} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={[styles.tier, { color: tint }]} numberOfLines={1}>
            {standing.tier}
          </Text>
          <Text style={styles.since} numberOfLines={1}>
            {'Partner since ' + longDate(standing.joined)}
          </Text>
        </View>
        <Stars count={standing.stars} />
      </View>

      <Text style={styles.length}>
        {standing.stars > 0
          ? membershipLength(standing.joined, now) + ' with BioLoop'
          : standing.days + ' days with BioLoop'}
      </Text>

      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: Math.round(standing.progress * 100) + '%', backgroundColor: tint },
          ]}
        />
      </View>
      <Text style={styles.progressLabel}>
        {standing.daysToNextStar === 0
          ? 'Your next star lands today.'
          : standing.daysToNextStar + ' days to your next star'}
      </Text>

      <Pressable
        onPress={handleDownload}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel="Download your certificate"
        style={({ pressed }) => [
          styles.button,
          { borderColor: tint },
          (pressed || busy) && { opacity: 0.6 },
        ]}
      >
        {busy ? (
          <ActivityIndicator size="small" color={tint} />
        ) : (
          <>
            <Ionicons name="ribbon-outline" size={16} color={tint} />
            <Text style={[styles.buttonText, { color: tint }]}>Download certificate</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
  },
  centred: { alignItems: 'center', justifyContent: 'center', minHeight: 120 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  seal: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F8F6',
  },
  headerCopy: { flex: 1 },
  tier: { fontSize: 14, fontWeight: '700', letterSpacing: 0.2 },
  since: { fontSize: 11.5, color: MUTED, marginTop: 1 },

  starRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  starOverflow: { fontSize: 12, fontWeight: '700', color: GOLD, marginLeft: 2 },

  length: { fontSize: 12.5, color: INK, marginTop: 12 },

  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EEF3F0',
    marginTop: 10,
    overflow: 'hidden',
  },
  fill: { height: 6, borderRadius: 3 },
  progressLabel: { fontSize: 11.5, color: MUTED, marginTop: 6 },

  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 11,
    marginTop: 14,
  },
  buttonText: { fontSize: 13, fontWeight: '600' },
});
