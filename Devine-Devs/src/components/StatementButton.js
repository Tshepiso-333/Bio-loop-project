// "Download statement" — one component for all four roles.
//
// Lives in four differently-themed screens, so it takes a `tint` rather than
// importing any one role's tokens. Fetches the role's own rows (RLS scopes
// them), renders the branded PDF, and opens the share sheet.
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getStatement } from '../services/statementService';
import { statementHtml } from '../lib/statementHtml';
import { exportPdf } from '../lib/documentExport';

const RANGES = [
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
  { label: '1 year', days: 365 },
];

export default function StatementButton({
  role,
  ownerId,
  accountName,
  tint = '#15643E',
  style,
  compact = false,
}) {
  const [busy, setBusy] = useState(false);
  const [range, setRange] = useState(90);

  const disabled = busy || (!ownerId && role !== 'admin');

  const handleDownload = async () => {
    if (disabled) return;
    setBusy(true);
    try {
      const statement = await getStatement({ role, ownerId, days: range });

      if (!statement.rows?.length) {
        Alert.alert(
          'Nothing to put on a statement',
          `No transactions in the last ${range} days. The statement would be empty, so it wasn't created.`
        );
        return;
      }

      const result = await exportPdf({
        html: statementHtml(statement, accountName),
        kind: `${role}-statement`,
        suffix: `${range}d`,
        dialogTitle: 'Save or send your statement',
      });

      if (!result.shared) {
        Alert.alert('Statement ready', `Saved as ${result.fileName}.`);
      }
    } catch (err) {
      const message = String(err?.message ?? '');
      // The native modules are missing from dev clients built before
      // expo-print/expo-sharing were added.
      if (/native module|doesn't exist|not available|cannot find/i.test(message)) {
        Alert.alert(
          'Not available in this build',
          'Downloading documents needs a newer build of the app. Open it in Expo Go, or rebuild the dev client.'
        );
      } else {
        Alert.alert('Could not create the statement', message || 'Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.wrap, style]}>
      {!compact ? (
        <View style={styles.rangeRow}>
          {RANGES.map((r) => {
            const active = r.days === range;
            return (
              <Pressable
                key={r.days}
                onPress={() => setRange(r.days)}
                disabled={busy}
                style={[
                  styles.rangeChip,
                  active && { backgroundColor: tint, borderColor: tint },
                ]}
              >
                <Text style={[styles.rangeText, active && styles.rangeTextActive]}>{r.label}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <Pressable
        onPress={handleDownload}
        disabled={disabled}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: tint },
          (pressed || disabled) && styles.buttonDim,
        ]}
      >
        {busy ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Ionicons name="download-outline" size={17} color="#fff" />
            <Text style={styles.buttonText}>
              {compact ? 'Statement' : 'Download statement (PDF)'}
            </Text>
          </>
        )}
      </Pressable>
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
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 14,
  },
  buttonDim: { opacity: 0.65 },
  buttonText: { color: '#fff', fontSize: 14.5, fontWeight: '700' },
});
