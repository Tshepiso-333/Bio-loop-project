// screens/manufacturer/ForecastsScreen.js
// NOTE: File is still named ForecastsScreen.js for tab-wiring compatibility.
// Contents have been replaced — this screen now renders the Finance tab.
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useManufacturerContext } from '../../src/contexts/ManufacturerContext';

const { width } = Dimensions.get('window');

// ─── THEME ───────────────────────────────────────────────────────────────────

const T = {
  primary: '#15643E',
  primaryDark: '#0F4D30',
  paleGreen: '#E7F1EB',
  selectedBg: '#F2F8F4',

  page: '#F6F8F7',
  card: '#FFFFFF',

  ink: '#122A1F',
  body: '#6B7F75',
  muted: '#A9B5AD',
  border: '#E4EDE7',
  divider: '#EEF3F0',

  white: '#FFFFFF',

  gradeA: '#2E8B5A',
  gradeB: '#f59e0b',
  gradeC: '#DC2626',

  danger: '#DC2626',
};

const S = { screenPadding: 16, cardPadding: 16, gap: 16 };
const R = { card: 16, pill: 999, chip: 10 };
const SH = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
};

// ─── DEFAULT BUSINESS CONSTANTS — live values come from the manufacturers row
// (biodiesel_conversion_pct etc., migration 048); these are only the fallback ──

const ASSUMPTIONS = {
  oilPrice: 3.5,         // R / L paid to restaurant
  conversion: 90,        // % oil → biodiesel
  biodieselPrice: 20,    // R / L selling price
  processingCost: 4.44,  // R / L processing
  logistics: 10000,      // R (total)
  other: 5000,           // R (total)
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const formatZAR = (n) =>
  `R${Math.round(n).toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`;
const formatZARDecimal = (n) => `R${Number(n).toFixed(2)}`;

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

const FinanceScreen = ({ navigation, onBack }) => {
  const { pickups = [], manufacturer } = useManufacturerContext();

  // Live from the manufacturers row (migration 048) — falls back to the
  // constants above only if the row hasn't loaded yet.
  const assumptions = useMemo(
    () => ({
      oilPrice: ASSUMPTIONS.oilPrice,
      conversion: Number(manufacturer?.biodiesel_conversion_pct ?? ASSUMPTIONS.conversion),
      biodieselPrice: Number(manufacturer?.biodiesel_price_per_liter ?? ASSUMPTIONS.biodieselPrice),
      processingCost: Number(manufacturer?.processing_cost_per_liter ?? ASSUMPTIONS.processingCost),
      logistics: Number(manufacturer?.logistics_cost ?? ASSUMPTIONS.logistics),
      other: Number(manufacturer?.other_operating_cost ?? ASSUMPTIONS.other),
    }),
    [manufacturer]
  );
  const insets = useSafeAreaInsets();

  // ── Aggregate oil purchased from pickups ──
  const oilData = useMemo(() => {
    const byGrade = {
      A: { litres: 0, avgPrice: 0, totalPaid: 0 },
      B: { litres: 0, avgPrice: 0, totalPaid: 0 },
      C: { litres: 0, avgPrice: 0, totalPaid: 0 },
    };
    let totalLitres = 0;
    let totalPaid = 0;

    (pickups || []).forEach((p) => {
      if (p.status !== 'completed' && p.status !== 'arrived_manufacturer') return;
      const litres = p.actual_volume_liters ?? p.estimated_volume_liters ?? 0;
      const grade = (p.quality_grade || 'A').toUpperCase();
      if (!byGrade[grade]) return;

      const paid =
        p.amount_paid ??
        p.total_paid ??
        litres * (p.price_per_liter ?? ASSUMPTIONS.oilPrice);

      byGrade[grade].litres += litres;
      byGrade[grade].totalPaid += paid;
      totalLitres += litres;
      totalPaid += paid;
    });

    Object.keys(byGrade).forEach((g) => {
      byGrade[g].avgPrice =
        byGrade[g].litres > 0
          ? byGrade[g].totalPaid / byGrade[g].litres
          : ASSUMPTIONS.oilPrice;
    });

    // Demo fallback when there is no real data yet
    if (totalLitres === 0) {
      const demo = {
        A: { litres: 2800, avgPrice: 3.8 },
        B: { litres: 1700, avgPrice: 3.2 },
        C: { litres: 500, avgPrice: 2.5 },
      };
      const demoTotals = {
        A: demo.A.litres * demo.A.avgPrice,
        B: demo.B.litres * demo.B.avgPrice,
        C: demo.C.litres * demo.C.avgPrice,
      };
      return {
        byGrade: {
          A: { ...demo.A, totalPaid: demoTotals.A },
          B: { ...demo.B, totalPaid: demoTotals.B },
          C: { ...demo.C, totalPaid: demoTotals.C },
        },
        totalLitres: 5000,
        totalPaid: demoTotals.A + demoTotals.B + demoTotals.C,
        isDemo: true,
      };
    }

    return { byGrade, totalLitres, totalPaid, isDemo: false };
  }, [pickups]);

  // ── Calculated economics (using fixed constants) ──
  const calculations = useMemo(() => {
    const oilPurchased = oilData.totalPaid;
    const biodiesel = oilData.totalLitres * (assumptions.conversion / 100);
    const revenue = biodiesel * assumptions.biodieselPrice;
    const processing = biodiesel * assumptions.processingCost;
    const logistics = assumptions.logistics;
    const other = assumptions.other;

    const totalCosts = oilPurchased + processing + logistics + other;
    const margin = revenue - totalCosts;

    return {
      oilPurchased,
      biodiesel,
      revenue,
      processing,
      logistics,
      other,
      totalCosts,
      margin,
    };
  }, [oilData, assumptions]);

  const totalLitres = oilData.totalLitres;

  // ─── SMALL REUSABLES ─────────────────────────────────────────────────────

  const SummaryCard = ({ icon, iconBg, label, value, sub, valueColor }) => (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={T.primary} />
      </View>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, valueColor && { color: valueColor }]}>
        {value}
      </Text>
      {sub ? <Text style={styles.summarySub}>{sub}</Text> : null}
    </View>
  );

  const CostRow = ({ label, value, emphasis, color }) => (
    <View style={styles.costRow}>
      <Text style={[styles.costLabel, emphasis && styles.costLabelEmphasis]}>
        {label}
      </Text>
      <Text
        style={[
          styles.costValue,
          emphasis && styles.costValueEmphasis,
          color && { color },
        ]}
      >
        {value}
      </Text>
    </View>
  );

  // ─── COST BAR CHART ──────────────────────────────────────────────────────

  const CostBarChart = () => {
    const bars = [
      { label: 'Oil', value: calculations.oilPurchased, color: T.primary },
      { label: 'Logistics', value: calculations.logistics, color: T.gradeB },
      { label: 'Processing', value: calculations.processing, color: '#2563EB' },
      { label: 'Other', value: calculations.other, color: T.muted },
    ];
    const max = Math.max(...bars.map((b) => b.value), 1);

    return (
      <View style={styles.barChartContainer}>
        {bars.map((b) => {
          const pct = (b.value / max) * 100;
          return (
            <View key={b.label} style={styles.barRow}>
              <Text style={styles.barLabel}>{b.label}</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${pct}%`, backgroundColor: b.color },
                  ]}
                />
              </View>
              <Text style={styles.barValue}>{formatZAR(b.value)}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  // ─── HEADER ──────────────────────────────────────────────────────────────

  const Header = () => (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={T.card} />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Finance</Text>
            <Text style={styles.headerSubtitle}>Cost · Value · Margin</Text>
          </View>
        </View>
      </View>
    </>
  );

  // ─── RENDER ──────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── 4 Big Summary Cards ── */}
        <View style={styles.summaryGrid}>
          <SummaryCard
            icon="cart-outline"
            iconBg={T.paleGreen}
            label="Oil Purchased"
            value={formatZAR(calculations.oilPurchased)}
            sub={`${totalLitres.toLocaleString()} L`}
          />
          <SummaryCard
            icon="flash-outline"
            iconBg={T.paleGreen}
            label="Est. Biodiesel"
            value={`${Math.round(calculations.biodiesel).toLocaleString()} L`}
            sub={`${assumptions.conversion}% conversion`}
          />
          <SummaryCard
            icon="cash-outline"
            iconBg={T.selectedBg}
            label="Est. Revenue"
            value={formatZAR(calculations.revenue)}
            sub={`@ ${formatZARDecimal(assumptions.biodieselPrice)}/L`}
          />
          <SummaryCard
            icon="trending-up-outline"
            iconBg={T.selectedBg}
            label="Est. Margin"
            value={formatZAR(calculations.margin)}
            sub={calculations.margin >= 0 ? 'Positive' : 'Negative'}
            valueColor={calculations.margin >= 0 ? T.primary : T.danger}
          />
        </View>

        {/* ── Production Value chain ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Production Value</Text>
          <View style={styles.card}>
            <View style={styles.chainRow}>
              <View style={styles.chainIconWrap}>
                <Ionicons name="water-outline" size={18} color={T.primary} />
              </View>
              <View style={styles.chainText}>
                <Text style={styles.chainValue}>
                  {totalLitres.toLocaleString()} L
                </Text>
                <Text style={styles.chainLabel}>Waste Oil Collected</Text>
              </View>
            </View>

            <View style={styles.chainDivider}>
              <Ionicons name="arrow-down" size={14} color={T.muted} />
            </View>

            <View style={styles.chainRow}>
              <View style={styles.chainIconWrap}>
                <Ionicons name="flash-outline" size={18} color={T.primary} />
              </View>
              <View style={styles.chainText}>
                <Text style={styles.chainValue}>
                  {Math.round(calculations.biodiesel).toLocaleString()} L
                </Text>
                <Text style={styles.chainLabel}>
                  Estimated Biodiesel ({assumptions.conversion}% conversion)
                </Text>
              </View>
            </View>

            <View style={styles.chainDivider}>
              <Ionicons name="arrow-down" size={14} color={T.muted} />
            </View>

            <View style={styles.chainRow}>
              <View
                style={[styles.chainIconWrap, { backgroundColor: T.selectedBg }]}
              >
                <Ionicons name="cash-outline" size={18} color={T.primary} />
              </View>
              <View style={styles.chainText}>
                <Text style={[styles.chainValue, { color: T.primary }]}>
                  {formatZAR(calculations.revenue)}
                </Text>
                <Text style={styles.chainLabel}>Potential Revenue</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Cost Breakdown ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cost Breakdown</Text>
          <View style={styles.card}>
            <CostRow
              label="Oil purchased"
              value={formatZAR(calculations.oilPurchased)}
            />
            <CostRow
              label="Collection & logistics"
              value={formatZAR(calculations.logistics)}
            />
            <CostRow
              label="Processing"
              value={formatZAR(calculations.processing)}
            />
            <CostRow
              label="Other operating costs"
              value={formatZAR(calculations.other)}
            />
            <View style={styles.costDivider} />
            <CostRow
              label="Total Costs"
              value={formatZAR(calculations.totalCosts)}
              emphasis
            />
            <CostRow
              label="Estimated Margin"
              value={formatZAR(calculations.margin)}
              emphasis
              color={calculations.margin >= 0 ? T.primary : T.danger}
            />

            <View style={styles.chartSpacer} />
            <CostBarChart />
          </View>
        </View>

        {/* ── Oil Inventory by Grade ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Oil Inventory by Grade</Text>
          <View style={styles.card}>
            {['A', 'B', 'C'].map((g, i) => {
              const row = oilData.byGrade[g];
              const color =
                g === 'A' ? T.gradeA : g === 'B' ? T.gradeB : T.gradeC;
              const label =
                g === 'A' ? '🟢 Grade A' : g === 'B' ? '🟡 Grade B' : '🔴 Grade C';
              return (
                <View
                  key={g}
                  style={[styles.gradeRow, i === 2 && { borderBottomWidth: 0 }]}
                >
                  <View style={[styles.gradeDot, { backgroundColor: color }]} />
                  <Text style={styles.gradeName}>{label}</Text>
                  <Text style={styles.gradeVolume}>
                    {row.litres.toLocaleString()} L
                  </Text>
                  <Text style={styles.gradePrice}>
                    {formatZARDecimal(row.avgPrice)}/L
                  </Text>
                </View>
              );
            })}
            <View style={styles.costDivider} />
            <View style={styles.gradeRow}>
              <View style={{ width: 12 }} />
              <Text style={[styles.gradeName, { fontWeight: '700' }]}>Total</Text>
              <Text style={[styles.gradeVolume, { fontWeight: '700' }]}>
                {oilData.totalLitres.toLocaleString()} L
              </Text>
              <Text
                style={[styles.gradePrice, { color: T.ink, fontWeight: '700' }]}
              >
                {formatZAR(oilData.totalPaid)}
              </Text>
            </View>

            {oilData.isDemo && (
              <Text style={styles.demoHint}>
                Showing sample data — real figures populate once pickups are
                confirmed.
              </Text>
            )}
          </View>
        </View>

        {/* ── Environmental Impact ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Environmental Impact</Text>
          <View style={[styles.card, styles.impactCard]}>
            <View style={styles.impactRow}>
              <View style={styles.impactIconWrap}>
                <Ionicons name="leaf-outline" size={18} color={T.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.impactValue}>
                  {totalLitres.toLocaleString()} L
                </Text>
                <Text style={styles.impactLabel}>
                  Waste oil diverted from landfill
                </Text>
              </View>
            </View>
            <View style={styles.impactRow}>
              <View style={styles.impactIconWrap}>
                <Ionicons name="flash-outline" size={18} color={T.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.impactValue}>
                  {Math.round(calculations.biodiesel).toLocaleString()} L
                </Text>
                <Text style={styles.impactLabel}>
                  Potential renewable fuel produced
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.page },
  scrollView: { flex: 1 },

  header: {
    backgroundColor: T.card,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    ...SH.card,
  },
  headerContent: {
    paddingHorizontal: S.screenPadding,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  headerTextContainer: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: T.ink },
  headerSubtitle: { fontSize: 11, color: T.body, marginTop: 2 },

  // Summary grid
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: S.screenPadding,
    marginTop: S.gap + 4,
    rowGap: 12,
  },
  summaryCard: {
    width: (width - S.screenPadding * 2 - 12) / 2,
    backgroundColor: T.card,
    borderRadius: R.card,
    padding: 14,
    borderWidth: 1,
    borderColor: T.border,
    ...SH.card,
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 11,
    color: T.muted,
    marginBottom: 4,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    color: T.ink,
  },
  summarySub: {
    fontSize: 11,
    color: T.body,
    marginTop: 4,
  },

  // Section wrapper
  section: {
    paddingHorizontal: S.screenPadding,
    marginTop: S.gap + 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: T.ink,
    marginBottom: 10,
  },
  card: {
    backgroundColor: T.card,
    borderRadius: R.card,
    padding: S.cardPadding,
    borderWidth: 1,
    borderColor: T.border,
    ...SH.card,
  },

  // Production chain
  chainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chainIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: T.paleGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chainText: { flex: 1 },
  chainValue: {
    fontSize: 20,
    fontWeight: '800',
    color: T.ink,
  },
  chainLabel: {
    fontSize: 12,
    color: T.body,
    marginTop: 2,
  },
  chainDivider: {
    alignItems: 'center',
    paddingVertical: 8,
  },

  // Cost breakdown
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  costLabel: {
    fontSize: 14,
    color: T.body,
  },
  costValue: {
    fontSize: 14,
    color: T.ink,
    fontWeight: '600',
  },
  costLabelEmphasis: {
    fontSize: 15,
    color: T.ink,
    fontWeight: '700',
  },
  costValueEmphasis: {
    fontSize: 16,
    fontWeight: '800',
  },
  costDivider: {
    height: 1,
    backgroundColor: T.divider,
    marginVertical: 8,
  },
  chartSpacer: { height: 8 },

  // Bar chart
  barChartContainer: { marginTop: 6, gap: 10 },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barLabel: {
    width: 78,
    fontSize: 12,
    color: T.body,
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: T.divider,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 4 },
  barValue: {
    width: 70,
    fontSize: 12,
    fontWeight: '600',
    color: T.ink,
    textAlign: 'right',
  },

  // Grade inventory
  gradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: T.divider,
    gap: 10,
  },
  gradeDot: { width: 10, height: 10, borderRadius: 5 },
  gradeName: { flex: 1, fontSize: 13, color: T.ink, fontWeight: '500' },
  gradeVolume: { fontSize: 13, color: T.body, width: 80, textAlign: 'right' },
  gradePrice: { fontSize: 13, color: T.body, width: 70, textAlign: 'right' },
  demoHint: {
    fontSize: 11,
    color: T.muted,
    marginTop: 10,
    fontStyle: 'italic',
  },

  // Impact
  impactCard: { gap: 14 },
  impactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  impactIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: T.paleGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  impactValue: { fontSize: 16, fontWeight: '700', color: T.ink },
  impactLabel: { fontSize: 12, color: T.body, marginTop: 2 },
});

export default FinanceScreen;