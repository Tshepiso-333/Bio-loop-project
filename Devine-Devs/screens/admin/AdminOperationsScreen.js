// screens/admin/AdminOperationsScreen.js
//
// The admin's monitoring console. Five tabs, each answering one question:
//
//   Signals  is the system healthy right now?        (the four golden signals:
//            traffic, errors, latency, saturation — plus the tiles that are
//            specific to this business: sensor alive, drivers on duty, money
//            in flight)
//   Checks   is the DATA correct?                    (standing invariants from
//            system_integrity, each with the hint for fixing it — this is the
//            "what caused the problem" tab)
//   Errors   what is broken, and how often?          (folded by fingerprint,
//            so one line per bug rather than per occurrence)
//   Speed    what is slow?                           (p50/p95/max per operation)
//   Log      what happened, in order, and who did it (the audit trail)
//
// Everything is read from views that are admin-only in the database
// (security_invoker over an is_admin()-gated table), so there is no
// client-side permission check that could be forgotten here.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AdminHeader from '../../src/admin/components/AdminHeader';
import {
  ADMIN_COLORS as COLORS,
  ADMIN_FONTS,
  ADMIN_RADII,
  ADMIN_SHADOWS,
} from '../../src/admin/adminTheme';
import {
  loadErrorOccurrences,
  loadOperationsBundle,
} from '../../src/services/observabilityService';
import { logEvent } from '../../src/services/telemetryService';

const TABS = [
  { key: 'signals', label: 'Signals', icon: 'pulse-outline' },
  { key: 'checks', label: 'Checks', icon: 'shield-checkmark-outline' },
  { key: 'errors', label: 'Errors', icon: 'bug-outline' },
  { key: 'speed', label: 'Speed', icon: 'speedometer-outline' },
  { key: 'log', label: 'Log', icon: 'list-outline' },
];

const LOG_FILTERS = [
  { key: 'problems', label: 'Problems' },
  { key: 'all', label: 'Everything' },
  { key: 'critical', label: 'Critical' },
  { key: 'error', label: 'Errors' },
  { key: 'warn', label: 'Warnings' },
  { key: 'info', label: 'Info' },
];

const LEVEL_STYLE = {
  critical: { color: COLORS.negative, bg: COLORS.alertBg, icon: 'alert-circle' },
  error: { color: COLORS.negative, bg: COLORS.alertBg, icon: 'close-circle' },
  warn: { color: COLORS.warnText, bg: COLORS.warnBg, icon: 'warning' },
  info: { color: COLORS.infoText, bg: COLORS.infoBg, icon: 'information-circle' },
  debug: { color: COLORS.muted, bg: COLORS.surfaceSoft, icon: 'ellipse-outline' },
};

const SEVERITY_STYLE = {
  critical: { color: COLORS.negative, bg: COLORS.alertBg, border: COLORS.alertBorder },
  error: { color: COLORS.negative, bg: COLORS.alertBg, border: COLORS.alertBorder },
  warn: { color: COLORS.warnText, bg: COLORS.warnBg, border: COLORS.warnBorder },
  info: { color: COLORS.infoText, bg: COLORS.infoBg, border: COLORS.infoBorder },
};

function money(value) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

// Relative time reads better than a timestamp in a log you are scanning.
function ago(value) {
  if (!value) return 'never';
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return '—';
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function stamp(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

// A tile turns amber/red once it crosses the threshold it is given, so the
// screen can be read at a glance instead of compared number by number.
function Tile({ label, value, hint, tone = 'neutral', icon }) {
  const toneStyle =
    tone === 'bad' ? { color: COLORS.negative, bg: COLORS.alertBg, border: COLORS.alertBorder }
    : tone === 'warn' ? { color: COLORS.warnText, bg: COLORS.warnBg, border: COLORS.warnBorder }
    : tone === 'good' ? { color: COLORS.positive, bg: COLORS.selectedBg, border: COLORS.border }
    : { color: COLORS.ink, bg: COLORS.card, border: COLORS.border };

  return (
    <View style={[styles.tile, { backgroundColor: toneStyle.bg, borderColor: toneStyle.border }]}>
      <View style={styles.tileTop}>
        <Text style={styles.tileLabel} numberOfLines={1}>{label}</Text>
        {icon ? <Ionicons name={icon} size={13} color={toneStyle.color} /> : null}
      </View>
      <Text style={[styles.tileValue, { color: toneStyle.color }]} numberOfLines={1}>{value}</Text>
      {hint ? <Text style={styles.tileHint} numberOfLines={2}>{hint}</Text> : null}
    </View>
  );
}

function SectionTitle({ children, note }) {
  return (
    <View style={styles.sectionTitleWrap}>
      <Text style={styles.sectionTitle}>{children}</Text>
      {note ? <Text style={styles.sectionNote}>{note}</Text> : null}
    </View>
  );
}

function Empty({ icon = 'checkmark-circle-outline', title, text }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyCircle}>
        <Ionicons name={icon} size={24} color={COLORS.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {text ? <Text style={styles.emptyText}>{text}</Text> : null}
    </View>
  );
}

export default function AdminOperationsScreen({ navigation }) {
  const [tab, setTab] = useState('signals');
  const [logFilter, setLogFilter] = useState('problems');
  const [search, setSearch] = useState('');
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [group, setGroup] = useState(null);
  const [occurrences, setOccurrences] = useState([]);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const next = await loadOperationsBundle({ level: logFilter, search });
      setBundle(next);
    } catch (error) {
      setLoadError(error?.message ?? 'Could not load operations data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [logFilter, search]);

  useEffect(() => { load(); }, [load]);

  // An admin opening the audit log is itself an auditable act — the logging
  // literature is unanimous on this, and it costs one row.
  useEffect(() => {
    logEvent({
      event: 'audit.viewed',
      level: 'info',
      message: 'Admin opened the operations console',
      subjectTable: 'system_events',
    });
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const health = bundle?.health ?? null;
  const integrity = bundle?.integrity ?? [];
  const failingChecks = useMemo(() => integrity.filter((c) => c.failing > 0), [integrity]);
  const worstSeverity = useMemo(() => {
    if (failingChecks.some((c) => c.severity === 'critical')) return 'critical';
    if (failingChecks.some((c) => c.severity === 'error')) return 'error';
    if (failingChecks.length) return 'warn';
    return null;
  }, [failingChecks]);

  const openGroup = async (row) => {
    setGroup(row);
    setOccurrences([]);
    try {
      setOccurrences(await loadErrorOccurrences(row.fingerprint));
    } catch {
      setOccurrences([]);
    }
  };

  const toggle = (key) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  // ------------------------------------------------------------------ Signals
  const renderSignals = () => {
    if (!health) return <Empty icon="cloud-offline-outline" title="No health data" text="The system_health view returned nothing." />;

    const errorRate = Number(health.error_rate_pct ?? 0);
    const p95 = Number(health.p95_ms ?? 0);

    return (
      <View>
        <View style={[
          styles.verdict,
          worstSeverity === 'critical' || worstSeverity === 'error'
            ? { backgroundColor: COLORS.alertBg, borderColor: COLORS.alertBorder }
            : worstSeverity === 'warn'
              ? { backgroundColor: COLORS.warnBg, borderColor: COLORS.warnBorder }
              : { backgroundColor: COLORS.selectedBg, borderColor: COLORS.border },
        ]}>
          <Ionicons
            name={worstSeverity ? 'warning' : 'checkmark-circle'}
            size={20}
            color={worstSeverity === 'warn' ? COLORS.warnText : worstSeverity ? COLORS.negative : COLORS.positive}
          />
          <Text style={styles.verdictText}>
            {failingChecks.length === 0
              ? `All ${integrity.length} correctness checks pass. Nothing needs attention.`
              : `${failingChecks.length} of ${integrity.length} checks need attention — see the Checks tab.`}
          </Text>
        </View>

        <SectionTitle note="The four signals Google's SRE practice says to watch first.">
          Golden signals · last 24h
        </SectionTitle>
        <View style={styles.tileGrid}>
          <Tile
            label="Traffic" icon="trending-up-outline"
            value={`${health.events_24h ?? 0}`}
            hint={`${health.pickups_24h ?? 0} pickups · ${health.readings_24h ?? 0} sensor readings`}
          />
          <Tile
            label="Error rate" icon="close-circle-outline"
            value={`${errorRate.toFixed(2)}%`}
            tone={errorRate > 5 ? 'bad' : errorRate > 1 ? 'warn' : 'good'}
            hint={`${health.errors_24h ?? 0} errors · ${health.warnings_24h ?? 0} warnings`}
          />
          <Tile
            label="Latency p95" icon="speedometer-outline"
            value={health.p95_ms == null ? '—' : `${health.p95_ms}ms`}
            tone={p95 > 3000 ? 'bad' : p95 > 1200 ? 'warn' : health.p95_ms == null ? 'neutral' : 'good'}
            hint={health.p50_ms == null ? 'No samples yet' : `p50 ${health.p50_ms}ms · max ${health.max_ms}ms`}
          />
          <Tile
            label="Saturation" icon="layers-outline"
            value={`${health.open_pickups ?? 0}`}
            tone={(health.awaiting_driver ?? 0) > 0 ? 'warn' : 'good'}
            hint={`${health.awaiting_driver ?? 0} waiting on a driver · ${health.awaiting_manufacturer ?? 0} on a manufacturer`}
          />
        </View>

        <SectionTitle note="The signals that are specific to collecting oil, not to servers.">
          Operations
        </SectionTitle>
        <View style={styles.tileGrid}>
          <Tile
            label="Drivers on duty" icon="car-outline"
            value={`${health.drivers_on_duty ?? 0} / ${health.drivers_total ?? 0}`}
            tone={(health.drivers_on_duty ?? 0) === 0 ? 'bad' : 'good'}
            hint={(health.drivers_on_duty ?? 0) === 0
              ? 'A full tank cannot be dispatched with nobody on duty'
              : 'Auto-dispatch has someone to assign to'}
          />
          <Tile
            label="Sensor last seen" icon="hardware-chip-outline"
            value={ago(health.device_last_seen)}
            tone={(health.devices_silent ?? 0) > 0 ? 'warn' : 'good'}
            hint={(health.devices_silent ?? 0) > 0
              ? `${health.devices_silent} sensor(s) silent over 24h`
              : 'Reporting normally'}
          />
          <Tile
            label="Rejected sensor calls" icon="lock-closed-outline"
            value={`${health.device_auth_failures_24h ?? 0}`}
            tone={(health.device_auth_failures_24h ?? 0) > 0 ? 'warn' : 'good'}
            hint="Bad or missing device token in the last 24h"
          />
          <Tile
            label="Critical events" icon="alert-circle-outline"
            value={`${health.critical_24h ?? 0}`}
            tone={(health.critical_24h ?? 0) > 0 ? 'bad' : 'good'}
            hint="Crashes and privilege changes"
          />
        </View>

        <SectionTitle note="Every rand the platform is responsible for right now.">
          Money in flight
        </SectionTitle>
        <View style={styles.tileGrid}>
          <Tile
            label="Awaiting payment" icon="hourglass-outline"
            value={money(health.payments_pending_value)}
            tone={Number(health.payments_pending_value ?? 0) > 0 ? 'warn' : 'good'}
            hint="Checkouts opened but not settled"
          />
          <Tile
            label="Failed payments" icon="card-outline"
            value={`${health.payments_failed_7d ?? 0}`}
            tone={(health.payments_failed_7d ?? 0) > 0 ? 'bad' : 'good'}
            hint="Last 7 days"
          />
          <Tile
            label="In driver wallets" icon="wallet-outline"
            value={money(health.unwithdrawn_value)}
            hint="Earned, not yet withdrawn"
          />
          <Tile
            label="Awaiting confirm" icon="checkmark-done-outline"
            value={`${health.awaiting_manufacturer ?? 0}`}
            tone={(health.awaiting_manufacturer ?? 0) > 2 ? 'warn' : 'neutral'}
            hint="Delivered, manufacturer has not confirmed"
          />
        </View>
      </View>
    );
  };

  // ------------------------------------------------------------------- Checks
  const renderChecks = () => {
    if (integrity.length === 0) {
      return <Empty icon="cloud-offline-outline" title="No checks returned" text="system_integrity returned nothing." />;
    }

    return (
      <View>
        <View style={styles.verdict}>
          <Ionicons
            name={failingChecks.length ? 'warning' : 'checkmark-circle'}
            size={20}
            color={failingChecks.length ? COLORS.warnText : COLORS.positive}
          />
          <Text style={styles.verdictText}>
            {failingChecks.length
              ? `${failingChecks.length} failing, ${integrity.length - failingChecks.length} passing. Tap a row for the cause and the fix.`
              : `All ${integrity.length} invariants hold.`}
          </Text>
        </View>

        {integrity.map((check) => {
          const failing = check.failing > 0;
          const tone = failing ? (SEVERITY_STYLE[check.severity] ?? SEVERITY_STYLE.warn) : null;
          const open = !!expanded[check.check_key];

          return (
            <Pressable
              key={check.check_key}
              onPress={() => toggle(check.check_key)}
              style={({ pressed }) => [
                styles.checkRow,
                failing && { backgroundColor: tone.bg, borderColor: tone.border },
                pressed && { opacity: 0.85 },
              ]}
            >
              <View style={styles.checkHead}>
                <Ionicons
                  name={failing ? (check.severity === 'warn' ? 'warning' : 'close-circle') : 'checkmark-circle'}
                  size={18}
                  color={failing ? tone.color : COLORS.positive}
                />
                <View style={styles.checkCopy}>
                  <Text style={styles.checkTitle}>{check.title}</Text>
                  <Text style={styles.checkKey}>{check.check_key}</Text>
                </View>
                <View style={[styles.countPill, failing && { backgroundColor: tone.color }]}>
                  <Text style={[styles.countPillText, failing && { color: COLORS.white }]}>
                    {failing ? check.failing : 'OK'}
                  </Text>
                </View>
              </View>

              {open ? (
                <View style={styles.checkBody}>
                  {check.detail ? (
                    <>
                      <Text style={styles.checkBodyLabel}>Affected</Text>
                      <Text style={styles.checkBodyText}>{check.detail}</Text>
                    </>
                  ) : null}
                  <Text style={styles.checkBodyLabel}>Why this happens</Text>
                  <Text style={styles.checkBodyText}>{check.hint}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    );
  };

  // ------------------------------------------------------------------- Errors
  const renderErrors = () => {
    const groups = bundle?.errorGroups ?? [];
    if (groups.length === 0) {
      return <Empty title="No errors recorded" text="Nothing has thrown since the log was last cleared." />;
    }

    return (
      <View>
        <SectionTitle note="Folded by fingerprint: one row per bug, however many times it fired.">
          {groups.length} error group{groups.length === 1 ? '' : 's'}
        </SectionTitle>

        {groups.map((row) => (
          <Pressable
            key={row.fingerprint}
            onPress={() => openGroup(row)}
            style={({ pressed }) => [styles.errorRow, pressed && { opacity: 0.85 }]}
          >
            <View style={styles.errorTop}>
              <View style={styles.occurrencePill}>
                <Text style={styles.occurrencePillText}>{row.occurrences}×</Text>
              </View>
              <Text style={styles.errorEvent} numberOfLines={1}>{row.event}</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
            </View>
            <Text style={styles.errorMessage} numberOfLines={2}>
              {row.latest_message ?? 'No message'}
            </Text>
            <Text style={styles.errorMeta}>
              last {ago(row.last_seen)} · first {ago(row.first_seen)}
              {row.users_affected ? ` · ${row.users_affected} user(s)` : ''}
              {row.app_version ? ` · v${row.app_version}` : ''}
            </Text>
          </Pressable>
        ))}
      </View>
    );
  };

  // -------------------------------------------------------------------- Speed
  const renderSpeed = () => {
    const rows = bundle?.latency ?? [];
    if (rows.length === 0) {
      return (
        <Empty
          icon="speedometer-outline"
          title="No timing samples yet"
          text="Latency is recorded by withTiming() around service calls. Use the app for a minute and these fill in."
        />
      );
    }

    return (
      <View>
        <SectionTitle note="Slowest first, by p95 — the number users actually feel.">
          Operation latency · last 7 days
        </SectionTitle>

        <View style={styles.speedHead}>
          <Text style={[styles.speedCell, styles.speedEventCell, styles.speedHeadText]}>Operation</Text>
          <Text style={[styles.speedCell, styles.speedHeadText]}>n</Text>
          <Text style={[styles.speedCell, styles.speedHeadText]}>p50</Text>
          <Text style={[styles.speedCell, styles.speedHeadText]}>p95</Text>
          <Text style={[styles.speedCell, styles.speedHeadText]}>max</Text>
        </View>

        {rows.map((row) => {
          const p95 = Number(row.p95_ms ?? 0);
          const tone = p95 > 3000 ? COLORS.negative : p95 > 1200 ? COLORS.warnText : COLORS.ink;
          return (
            <View key={row.event} style={styles.speedRow}>
              <Text style={[styles.speedCell, styles.speedEventCell]} numberOfLines={1}>{row.event}</Text>
              <Text style={styles.speedCell}>{row.samples}</Text>
              <Text style={styles.speedCell}>{row.p50_ms}</Text>
              <Text style={[styles.speedCell, { color: tone, fontFamily: ADMIN_FONTS.bold }]}>{row.p95_ms}</Text>
              <Text style={styles.speedCell}>{row.max_ms}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  // ---------------------------------------------------------------------- Log
  const renderLog = () => {
    const events = bundle?.events ?? [];

    return (
      <View>
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={16} color={COLORS.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Filter by event or message"
            placeholderTextColor={COLORS.muted}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search ? (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={COLORS.muted} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {LOG_FILTERS.map((filter) => {
            const active = logFilter === filter.key;
            return (
              <Pressable
                key={filter.key}
                onPress={() => setLogFilter(filter.key)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {events.length === 0 ? (
          <Empty icon="list-outline" title="Nothing matches" text="No events for this filter." />
        ) : (
          events.map((event) => {
            const style = LEVEL_STYLE[event.level] ?? LEVEL_STYLE.info;
            const key = `event-${event.id}`;
            const open = !!expanded[key];
            const hasContext = event.context && Object.keys(event.context).length > 0;

            return (
              <Pressable
                key={key}
                onPress={() => toggle(key)}
                style={({ pressed }) => [styles.logRow, pressed && { opacity: 0.85 }]}
              >
                <View style={styles.logTop}>
                  <View style={[styles.levelDot, { backgroundColor: style.bg }]}>
                    <Ionicons name={style.icon} size={12} color={style.color} />
                  </View>
                  <Text style={styles.logEvent} numberOfLines={1}>{event.event}</Text>
                  <Text style={styles.logTime}>{ago(event.occurred_at)}</Text>
                </View>

                {event.message ? (
                  <Text style={styles.logMessage} numberOfLines={open ? undefined : 2}>
                    {event.message}
                  </Text>
                ) : null}

                <Text style={styles.logMeta}>
                  {event.source}
                  {event.actor_role ? ` · ${event.actor_role}` : ''}
                  {event.subject_table ? ` · ${event.subject_table}` : ''}
                  {event.duration_ms != null ? ` · ${event.duration_ms}ms` : ''}
                </Text>

                {open ? (
                  <View style={styles.logDetail}>
                    <Text style={styles.logDetailLabel}>When</Text>
                    <Text style={styles.logDetailText}>{stamp(event.occurred_at)}</Text>

                    {event.subject_id ? (
                      <>
                        <Text style={styles.logDetailLabel}>Record</Text>
                        <Text style={styles.logDetailText}>
                          {event.subject_table} · {event.subject_id}
                        </Text>
                      </>
                    ) : null}

                    {hasContext ? (
                      <>
                        <Text style={styles.logDetailLabel}>Context</Text>
                        <Text style={styles.logMono}>{JSON.stringify(event.context, null, 2)}</Text>
                      </>
                    ) : null}

                    {event.stack ? (
                      <>
                        <Text style={styles.logDetailLabel}>Stack</Text>
                        <Text style={styles.logMono} numberOfLines={12}>{event.stack}</Text>
                      </>
                    ) : null}
                  </View>
                ) : null}
              </Pressable>
            );
          })
        )}

        {events.length >= 200 ? (
          <Text style={styles.truncated}>
            Showing the newest 200 events. Narrow the filter to see further back.
          </Text>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <AdminHeader
        title="Operations"
        showBack
        onBack={() => navigation.goBack()}
        actions={[{ key: 'refresh', icon: 'refresh-outline', onPress: onRefresh }]}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
          {TABS.map((item) => {
            const active = tab === item.key;
            const badge =
              item.key === 'checks' ? failingChecks.length
              : item.key === 'errors' ? (bundle?.errorGroups?.length ?? 0)
              : 0;

            return (
              <Pressable
                key={item.key}
                onPress={() => setTab(item.key)}
                style={[styles.tab, active && styles.tabActive]}
              >
                <Ionicons name={item.icon} size={15} color={active ? COLORS.white : COLORS.body} />
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{item.label}</Text>
                {badge > 0 ? (
                  <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
                    <Text style={[styles.tabBadgeText, active && { color: COLORS.primary }]}>{badge}</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Reading system state…</Text>
          </View>
        ) : null}

        {loadError ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={18} color={COLORS.alertText} />
            <Text style={styles.errorCardText}>{loadError}</Text>
          </View>
        ) : null}

        {bundle?.errors?.length ? (
          <View style={styles.errorCard}>
            <Ionicons name="warning-outline" size={18} color={COLORS.warnText} />
            <Text style={styles.errorCardText}>
              {bundle.errors.map((e) => `${e.view}: ${e.message}`).join('\n')}
            </Text>
          </View>
        ) : null}

        {!loading && tab === 'signals' ? renderSignals() : null}
        {!loading && tab === 'checks' ? renderChecks() : null}
        {!loading && tab === 'errors' ? renderErrors() : null}
        {!loading && tab === 'speed' ? renderSpeed() : null}
        {!loading && tab === 'log' ? renderLog() : null}
      </ScrollView>

      {/* Error group detail: every occurrence behind one fingerprint. */}
      <Modal visible={!!group} transparent animationType="slide" onRequestClose={() => setGroup(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>{group?.event}</Text>
              <Pressable onPress={() => setGroup(null)} hitSlop={10}>
                <Ionicons name="close" size={20} color={COLORS.ink} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              <Text style={styles.modalMessage}>{group?.latest_message}</Text>
              <Text style={styles.modalMeta}>
                {group?.occurrences} occurrence{group?.occurrences === 1 ? '' : 's'} ·
                first {stamp(group?.first_seen)} · last {stamp(group?.last_seen)}
              </Text>
              {group?.error_code ? (
                <>
                  <Text style={styles.logDetailLabel}>Code</Text>
                  <Text style={styles.logDetailText}>{group.error_code}</Text>
                </>
              ) : null}
              {group?.latest_stack ? (
                <>
                  <Text style={styles.logDetailLabel}>Latest stack</Text>
                  <Text style={styles.logMono}>{group.latest_stack}</Text>
                </>
              ) : null}

              <Text style={styles.logDetailLabel}>Occurrences</Text>
              {occurrences.length === 0 ? (
                <Text style={styles.logDetailText}>Loading…</Text>
              ) : (
                occurrences.map((item) => (
                  <View key={item.id} style={styles.occurrenceRow}>
                    <Text style={styles.occurrenceWhen}>{stamp(item.occurred_at)}</Text>
                    <Text style={styles.occurrenceWho}>
                      {item.actor_role ?? 'system'}
                      {item.platform ? ` · ${item.platform}` : ''}
                      {item.duration_ms != null ? ` · ${item.duration_ms}ms` : ''}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.page },
  content: { padding: 16, paddingBottom: 40 },

  tabRow: { gap: 8, paddingBottom: 14 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 9, paddingHorizontal: 14,
    borderRadius: ADMIN_RADII.pill,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
  },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontFamily: ADMIN_FONTS.semiBold, fontSize: 12.5, color: COLORS.body },
  tabTextActive: { color: COLORS.white },
  tabBadge: {
    minWidth: 18, paddingHorizontal: 5, paddingVertical: 1,
    borderRadius: 9, backgroundColor: COLORS.negative, alignItems: 'center',
  },
  tabBadgeActive: { backgroundColor: COLORS.white },
  tabBadgeText: { fontFamily: ADMIN_FONTS.bold, fontSize: 10, color: COLORS.white },

  loading: { paddingVertical: 50, alignItems: 'center', gap: 10 },
  loadingText: { fontFamily: ADMIN_FONTS.medium, fontSize: 12.5, color: COLORS.body },

  errorCard: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: COLORS.alertBg, borderWidth: 1, borderColor: COLORS.alertBorder,
    borderRadius: ADMIN_RADII.chip, padding: 12, marginBottom: 12,
  },
  errorCardText: { flex: 1, fontFamily: ADMIN_FONTS.medium, fontSize: 12, color: COLORS.alertText, lineHeight: 17 },

  verdict: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: ADMIN_RADII.chip, padding: 13, marginBottom: 16,
  },
  verdictText: { flex: 1, fontFamily: ADMIN_FONTS.semiBold, fontSize: 12.5, color: COLORS.ink, lineHeight: 18 },

  sectionTitleWrap: { marginBottom: 10 },
  sectionTitle: { fontFamily: ADMIN_FONTS.extraBold, fontSize: 14, color: COLORS.ink },
  sectionNote: { marginTop: 2, fontFamily: ADMIN_FONTS.regular, fontSize: 11.5, color: COLORS.body, lineHeight: 16 },

  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  tile: {
    flexGrow: 1, flexBasis: '46%', minWidth: 150,
    borderRadius: ADMIN_RADII.chip, borderWidth: 1, padding: 12,
    ...ADMIN_SHADOWS.card,
  },
  tileTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  tileLabel: { flex: 1, fontFamily: ADMIN_FONTS.semiBold, fontSize: 11, color: COLORS.body },
  tileValue: { marginTop: 4, fontFamily: ADMIN_FONTS.extraBold, fontSize: 20, letterSpacing: -0.4 },
  tileHint: { marginTop: 3, fontFamily: ADMIN_FONTS.regular, fontSize: 10.5, color: COLORS.body, lineHeight: 14 },

  checkRow: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: ADMIN_RADII.chip, padding: 12, marginBottom: 8,
  },
  checkHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkCopy: { flex: 1 },
  checkTitle: { fontFamily: ADMIN_FONTS.semiBold, fontSize: 12.5, color: COLORS.ink, lineHeight: 17 },
  checkKey: { marginTop: 1, fontFamily: ADMIN_FONTS.regular, fontSize: 10, color: COLORS.muted },
  countPill: {
    minWidth: 30, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 10, backgroundColor: COLORS.surfaceSoft, alignItems: 'center',
  },
  countPillText: { fontFamily: ADMIN_FONTS.bold, fontSize: 11, color: COLORS.positive },
  checkBody: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border, gap: 2 },
  checkBodyLabel: { marginTop: 6, fontFamily: ADMIN_FONTS.semiBold, fontSize: 10, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.4 },
  checkBodyText: { fontFamily: ADMIN_FONTS.medium, fontSize: 12, color: COLORS.body, lineHeight: 17 },

  errorRow: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: ADMIN_RADII.chip, padding: 12, marginBottom: 8,
  },
  errorTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  occurrencePill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, backgroundColor: COLORS.alertBg },
  occurrencePillText: { fontFamily: ADMIN_FONTS.bold, fontSize: 10.5, color: COLORS.negative },
  errorEvent: { flex: 1, fontFamily: ADMIN_FONTS.semiBold, fontSize: 12.5, color: COLORS.ink },
  errorMessage: { marginTop: 6, fontFamily: ADMIN_FONTS.medium, fontSize: 12, color: COLORS.body, lineHeight: 17 },
  errorMeta: { marginTop: 5, fontFamily: ADMIN_FONTS.regular, fontSize: 10.5, color: COLORS.muted },

  speedHead: {
    flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 6,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  speedHeadText: { fontFamily: ADMIN_FONTS.semiBold, fontSize: 10, color: COLORS.muted, textTransform: 'uppercase' },
  speedRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  speedCell: { width: 46, textAlign: 'right', fontFamily: ADMIN_FONTS.medium, fontSize: 11.5, color: COLORS.body },
  speedEventCell: { flex: 1, width: undefined, textAlign: 'left', color: COLORS.ink },

  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: ADMIN_RADII.chip, paddingHorizontal: 12, paddingVertical: 9, marginBottom: 10,
  },
  searchInput: { flex: 1, fontFamily: ADMIN_FONTS.medium, fontSize: 12.5, color: COLORS.ink, padding: 0 },

  filterRow: { gap: 7, paddingBottom: 12 },
  filterChip: {
    paddingVertical: 7, paddingHorizontal: 12, borderRadius: ADMIN_RADII.pill,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
  },
  filterChipActive: { backgroundColor: COLORS.selectedBg, borderColor: COLORS.primary },
  filterChipText: { fontFamily: ADMIN_FONTS.medium, fontSize: 11.5, color: COLORS.body },
  filterChipTextActive: { color: COLORS.primary, fontFamily: ADMIN_FONTS.semiBold },

  logRow: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: ADMIN_RADII.chip, padding: 12, marginBottom: 7,
  },
  logTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  levelDot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  logEvent: { flex: 1, fontFamily: ADMIN_FONTS.semiBold, fontSize: 12, color: COLORS.ink },
  logTime: { fontFamily: ADMIN_FONTS.regular, fontSize: 10.5, color: COLORS.muted },
  logMessage: { marginTop: 6, fontFamily: ADMIN_FONTS.medium, fontSize: 12, color: COLORS.body, lineHeight: 17 },
  logMeta: { marginTop: 4, fontFamily: ADMIN_FONTS.regular, fontSize: 10, color: COLORS.muted },
  logDetail: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  logDetailLabel: { marginTop: 8, fontFamily: ADMIN_FONTS.semiBold, fontSize: 10, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.4 },
  logDetailText: { marginTop: 2, fontFamily: ADMIN_FONTS.medium, fontSize: 12, color: COLORS.body, lineHeight: 17 },
  logMono: {
    marginTop: 4, fontFamily: 'monospace', fontSize: 10.5, color: COLORS.ink, lineHeight: 15,
    backgroundColor: COLORS.surfaceSoft, borderRadius: 8, padding: 9,
  },
  truncated: { marginTop: 8, textAlign: 'center', fontFamily: ADMIN_FONTS.regular, fontSize: 11, color: COLORS.muted },

  empty: { alignItems: 'center', gap: 8, paddingTop: 50, paddingHorizontal: 20 },
  emptyCircle: {
    width: 58, height: 58, borderRadius: 29, marginBottom: 4,
    alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.paleGreen,
  },
  emptyTitle: { fontFamily: ADMIN_FONTS.bold, fontSize: 14, color: COLORS.ink },
  emptyText: { fontFamily: ADMIN_FONTS.medium, fontSize: 12.5, color: COLORS.body, textAlign: 'center', lineHeight: 18 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(18,42,31,0.45)', justifyContent: 'flex-end' },
  modalCard: {
    maxHeight: '85%', backgroundColor: COLORS.page,
    borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    paddingHorizontal: 18, paddingVertical: 15,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  modalTitle: { flex: 1, fontFamily: ADMIN_FONTS.extraBold, fontSize: 14.5, color: COLORS.ink },
  modalBody: { padding: 18 },
  modalMessage: { fontFamily: ADMIN_FONTS.semiBold, fontSize: 13, color: COLORS.ink, lineHeight: 19 },
  modalMeta: { marginTop: 6, fontFamily: ADMIN_FONTS.regular, fontSize: 11, color: COLORS.muted, lineHeight: 16 },
  occurrenceRow: { marginTop: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  occurrenceWhen: { fontFamily: ADMIN_FONTS.medium, fontSize: 11.5, color: COLORS.ink },
  occurrenceWho: { marginTop: 1, fontFamily: ADMIN_FONTS.regular, fontSize: 10.5, color: COLORS.muted },
});
