// "Documents" — every downloadable record for a role, in one place.
//
// Placement follows the convention the big money apps settled on: documents
// live with the money (Uber Driver puts them under Earnings; Uber Eats
// Manager under Payments > Payouts; banks under the account), behind a date
// range and a download action — never on the dashboard, never in Profile.
// Profile answers "who am I"; this answers "prove what happened".
//
// Lives in four differently-themed screens, so it takes a `tint` rather than
// importing any one role's tokens. RLS scopes every query to the caller's
// own rows, so the role/ownerId below pick relevance, not permission.
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getStatement, getCollectionsStatement } from '../services/statementService';
import { statementHtml } from '../lib/statementHtml';
import { exportPdf } from '../lib/documentExport';

const RANGES = [
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
  { label: '1 year', days: 365 },
];

const MONEY_DOC = {
  restaurant: { title: 'Payout statement', blurb: 'What you were paid for your oil' },
  collector: { title: 'Earnings statement', blurb: 'Trips earned, and withdrawals taken' },
  manufacturer: { title: 'Payment statement', blurb: 'What you paid for collected oil' },
  admin: { title: 'Platform statement', blurb: 'Commission, and what went to each side' },
};

export default function DocumentsCard({ role, ownerId, accountName, tint = '#15643E', style }) {
  const [range, setRange] = useState(90);
  const [busyKey, setBusyKey] = useState(null);

  const blocked = !ownerId && role !== 'admin';
  const money = MONEY_DOC[role] ?? { title: 'Statement', blurb: 'Your recorded transactions' };

  const documents = [
    { key: 'statement', icon: 'cash-outline', ...money, fetch: getStatement },
    {
      key: 'collections',
      icon: 'cube-outline',
      title: 'Collection history',
      blurb: 'Every collection, its litres and its grade',
      fetch: getCollectionsStatement,
    },
  ];

  const handleDownload = async (doc) => {
    if (blocked || busyKey) return;
    setBusyKey(doc.key);
    try {
      const document = await doc.fetch({ role, ownerId, days: range });

      if (!document.rows?.length) {
        Alert.alert(
          `Nothing to put in this ${doc.key === 'collections' ? 'history' : 'statement'}`,
          `No records in the last ${range} days, so the document wasn't created.`
        );
        return;
      }

      const result = await exportPdf({
        html: statementHtml(document, accountName),
        kind: `${role}-${doc.key}`,
        suffix: `${range}d`,
        dialogTitle: `Save or send your ${doc.title.toLowerCase()}`,
      });

      if (!result.shared) Alert.alert('Document ready', `Saved as ${result.fileName}.`);
    } catch (err) {
      const message = String(err?.message ?? '');
      // Dev clients built before expo-print/expo-sharing were added.
      if (/native module|doesn't exist|not available|cannot find/i.test(message)) {
        Alert.alert(
          'Not available in this build',
          'Downloading documents needs a newer build of the app.'
        );
      } else {
        Alert.alert('Could not create the document', message || 'Please try again.');
      }
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.rangeRow}>
        {RANGES.map((r) => {
          const active = r.days === range;
          return (
            <Pressable
              key={r.days}
              onPress={() => setRange(r.days)}
              disabled={!!busyKey}
              style={[styles.rangeChip, active && { backgroundColor: tint, borderColor: tint }]}
            >
              <Text style={[styles.rangeText, active && styles.rangeTextActive]}>{r.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {documents.map((doc, i) => (
        <Pressable
          key={doc.key}
          onPress={() => handleDownload(doc)}
          disabled={blocked || !!busyKey}
          style={({ pressed }) => [
            styles.row,
            i > 0 && styles.rowDivided,
            (pressed || blocked) && styles.rowDim,
          ]}
        >
          <View style={[styles.iconPad, { backgroundColor: `${tint}14` }]}>
            <Ionicons name={doc.icon} size={18} color={tint} />
          </View>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>{doc.title}</Text>
            <Text style={styles.rowBlurb}>{doc.blurb}</Text>
          </View>
          {busyKey === doc.key ? (
            <ActivityIndicator color={tint} size="small" />
          ) : (
            <Ionicons name="download-outline" size={19} color={tint} />
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  rangeRow: { flexDirection: 'row', gap: 8 },
  rangeChip: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E4EDE7',
    backgroundColor: '#F5F8F6',
  },
  rangeText: { fontSize: 12.5, color: '#6B7F75', fontWeight: '600' },
  rangeTextActive: { color: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  rowDivided: { borderTopWidth: 1, borderTopColor: '#EEF3F0' },
  rowDim: { opacity: 0.6 },
  iconPad: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 14.5, fontWeight: '700', color: '#12271E' },
  rowBlurb: { fontSize: 12.5, color: '#6B7F75', marginTop: 2 },
});
