// screens/manufacturer/QualityScreen.js
import React, { useMemo, useState } from 'react';
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
import Svg, {
  Path,
  Circle,
  Line,
  Text as SvgText,
  G,
} from 'react-native-svg';
import { useManufacturerContext } from '../../src/contexts/ManufacturerContext';
import { groupPickupsByMonth } from '../../src/utils/manufacturerAnalytics';

const { width } = Dimensions.get('window');

// ─── THEME ───────────────────────────────────────────────────────────────────

const T = {
  primary: '#10b981',
  primaryDark: '#059669',
  paleGreen: '#ECFDF5',
  selectedBg: '#F0FDF4',

  page: '#F9FAFB',
  card: '#FFFFFF',

  ink: '#111827',
  body: '#6B7280',
  muted: '#9CA3AF',
  border: '#E5E7EB',
  divider: '#F3F4F6',

  white: '#FFFFFF',

  gradeA: '#7EE92D',
  gradeB: '#f59e0b',
  gradeC: '#ef4444',
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

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

const QualityScreen = ({ navigation, onBack }) => {
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [expanded, setExpanded] = useState({ A: false, B: false, C: false });
  const { forecasts = [], pickups = [] } = useManufacturerContext();
  const insets = useSafeAreaInsets();

  const sevenDayForecast = forecasts?.find((f) => f.period_days === 7);

  const groupedSources = (pickups || []).reduce(
    (groups, p) => {
      const grade = (p.quality_grade || '').toUpperCase();
      const volume = p.estimated_volume_liters ?? p.actual_volume_liters ?? 0;
      const restaurantName = p.restaurants?.name ?? 'Unknown';
      if (grade === 'A' || grade === 'B' || grade === 'C') {
        groups[grade].push({ restaurant: restaurantName, volume, percentage: 0 });
      }
      return groups;
    },
    { A: [], B: [], C: [] }
  );

  const calculatePercentages = (sources) => {
    const total = sources.reduce((sum, item) => sum + item.volume, 0);
    return sources.map((item) => ({
      ...item,
      percentage: total > 0 ? Math.round((item.volume / total) * 100) : 0,
    }));
  };

  const gradeASources = calculatePercentages(groupedSources.A);
  const gradeBSources = calculatePercentages(groupedSources.B);
  const gradeCSources = calculatePercentages(groupedSources.C);

  const qualityDistribution = [
    {
      key: 'A',
      name: 'Grade A',
      value: sevenDayForecast?.grade_a_pct ?? 0,
      color: T.gradeA,
      totalVolume: gradeASources.reduce((sum, item) => sum + item.volume, 0),
      sources: gradeASources,
    },
    {
      key: 'B',
      name: 'Grade B',
      value: sevenDayForecast?.grade_b_pct ?? 0,
      color: T.gradeB,
      totalVolume: gradeBSources.reduce((sum, item) => sum + item.volume, 0),
      sources: gradeBSources,
    },
    {
      key: 'C',
      name: 'Grade C',
      value: sevenDayForecast?.grade_c_pct ?? 0,
      color: T.gradeC,
      totalVolume: gradeCSources.reduce((sum, item) => sum + item.volume, 0),
      sources: gradeCSources,
    },
  ];

  const qualityTrends = useMemo(() => groupPickupsByMonth(pickups, 4), [pickups]);

  const toggleExpand = (key) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  // ─── ICONS ────────────────────────────────────────────────────────────────

  const CheckCircleIcon = ({ color = '#fff', size = 20 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
      <Path
        d="M8 12L11 15L16 9"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  const AlertTriangleIcon = ({ color = '#fff', size = 20 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 9v4M12 17h.01" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M12 3L2 21h20L12 3z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
    </Svg>
  );

  const ChevronDownIcon = ({ color = T.body, size = 20, open }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d={open ? 'M6 15L12 9L18 15' : 'M6 9L12 15L18 9'}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  // ─── DONUT CHART (bulletproof, View-based) ────────────────────────────────
  //
  // Technique: render a stack of colored "half-disc" segments using two
  // rotated 50%-width mask layers per segment. This works on every platform
  // (iOS / Android / web) regardless of SVG stroke-dash rendering quirks.
  //
  // For 40% / 20% / 40% it produces green → orange → red clockwise from 12.

  const DonutChart = () => {
    const size = 180;
    const stroke = 28;
    const half = size / 2;

    // Normalize values so they always total 100 (in case forecast pcts
    // don't add to exactly 100).
    const total = qualityDistribution.reduce((sum, s) => sum + (s.value || 0), 0);
    const segments =
      total > 0
        ? qualityDistribution.map((s) => ({
            ...s,
            pct: (s.value / total) * 100,
          }))
        : [];

    // Build an array of { color, startDeg, endDeg } by walking cumulative %.
    let cursor = 0;
    const arcs = segments.map((s) => {
      const start = cursor;
      const end = cursor + s.pct;
      cursor = end;
      return { color: s.color, start, end, key: s.key };
    });

    // For each arc, render a "wedge" made of up to 4 quarter circles.
    // A wedge <= 180° is 1 outer semicircle + optional inner cut.
    // Simpler: use overlapping rotating half-discs clipped by a wrapper.
    //
    // Implementation: for each arc we render:
    //   - a base half-disc (rotated so the visible half covers [0,180])
    //   - if the arc exceeds 180°, we also render the opposite half
    //   - we stack arcs in order and mask the inner circle at the end
    //
    // To keep the code readable, we use the "rotate a 50%-wide colored rect
    // behind a circular clip" approach for each arc.

    const renderArc = (arc) => {
      const { color, start, end } = arc;
      const sweep = end - start;
      if (sweep <= 0) return null;

      // We render two half-disc pieces per arc to allow sweeps > 180°.
      const pieces = [];
      const remainder = Math.min(sweep, 180);
      // First half: rotate to `start`
      pieces.push(
        <View
          key={`${arc.key}-1`}
          style={{
            position: 'absolute',
            width: size,
            height: size,
            transform: [{ rotate: `${start - 90}deg` }],
          }}
        >
          <View
            style={{
              position: 'absolute',
              left: half,
              top: 0,
              width: half,
              height: size,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                position: 'absolute',
                left: -half,
                top: 0,
                width: size,
                height: size,
                borderRadius: half,
                backgroundColor: color,
                // Clip to just the visible half
                ...(remainder <= 180 ? {} : {}),
              }}
            />
          </View>
        </View>
      );

      // If sweep > 180°, render second half opposite side
      if (sweep > 180) {
        pieces.push(
          <View
            key={`${arc.key}-2`}
            style={{
              position: 'absolute',
              width: size,
              height: size,
              transform: [{ rotate: `${start + 90}deg` }],
            }}
          >
            <View
              style={{
                position: 'absolute',
                left: half,
                top: 0,
                width: half,
                height: size,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  position: 'absolute',
                  left: -half,
                  top: 0,
                  width: size,
                  height: size,
                  borderRadius: half,
                  backgroundColor: color,
                }}
              />
            </View>
          </View>
        );
      }

      // For arcs that don't span exactly 180°, use a rotate of a plain
      // full-disc behind a masking rect. This is the classic "conic"
      // approximation: the arc color rotates in from `start`, and we
      // overlay the next arc's color on top.

      return pieces;
    };

    // Simpler, reliable approach: stack full-rotation slices.
    // Each slice is a full circle painted the arc color, but we clip it
    // using a rotated "reveal" wrapper so only `sweep` degrees show.

    const renderSlice = (arc) => {
      const { color, start, end } = arc;
      const sweep = Math.min(end - start, 360);
      if (sweep <= 0) return null;

      // Two half-circles max needed
      const firstSweep = Math.min(sweep, 180);
      const secondSweep = Math.max(sweep - 180, 0);

      const sliceStyle = (rotateDeg, revealDeg) => ({
        position: 'absolute',
        width: size,
        height: size,
        transform: [{ rotate: `${rotateDeg}deg` }],
      });

      return (
        <View key={arc.key} style={StyleSheet.absoluteFill}>
          {/* First 180° max */}
          <View style={sliceStyle(start)}>
            <View
              style={{
                position: 'absolute',
                left: half,
                top: 0,
                width: half,
                height: size,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  position: 'absolute',
                  left: -half,
                  top: 0,
                  width: size,
                  height: size,
                  borderRadius: half,
                  backgroundColor: color,
                }}
              />
            </View>
          </View>

          {/* Second 180° max */}
          {secondSweep > 0 && (
            <View style={sliceStyle(start + 180)}>
              <View
                style={{
                  position: 'absolute',
                  left: half,
                  top: 0,
                  width: half,
                  height: size,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    position: 'absolute',
                    left: -half,
                    top: 0,
                    width: size,
                    height: size,
                    borderRadius: half,
                    backgroundColor: color,
                  }}
                />
              </View>
            </View>
          )}
        </View>
      );
    };

    // We can't cleanly do partial wedges with pure views without a lot of
    // math. So we use the "rotating full-disc + mask circle" approach:
    //
    //   for each arc:  render a full rotated disc of that color, then
    //                  overlay the NEXT arc's disc rotated to its start.
    //
    // This is the classic conic-gradient approximation and works reliably.

    const ConicDonut = () => {
      // Draw colors in reverse so the first slice ends up on top.
      const reversed = [...arcs].reverse();
      return (
        <View style={{ width: size, height: size }}>
          {/* Base neutral ring */}
          <View
            style={{
              position: 'absolute',
              width: size,
              height: size,
              borderRadius: half,
              backgroundColor: T.divider,
            }}
          />
          {reversed.map((arc) => {
            const sweep = Math.min(arc.end - arc.start, 360);
            if (sweep <= 0) return null;

            // For sweeps >= 180 we need two half-turns.
            // For sweeps < 180 we use a single rotating half disc.
            const firstSweep = Math.min(sweep, 180);
            const secondSweep = Math.max(sweep - 180, 0);

            return (
              <React.Fragment key={arc.key}>
                {/* First half (0° → up to 180°) */}
                <View
                  style={{
                    position: 'absolute',
                    width: size,
                    height: size,
                    transform: [{ rotate: `${arc.start}deg` }],
                  }}
                >
                  <View
                    style={{
                      position: 'absolute',
                      left: half,
                      top: 0,
                      width: half,
                      height: size,
                      overflow: 'hidden',
                    }}
                  >
                    <View
                      style={{
                        position: 'absolute',
                        left: -half,
                        top: 0,
                        width: size,
                        height: size,
                        borderRadius: half,
                        backgroundColor: arc.color,
                        transform: [{ rotate: `${firstSweep}deg` }],
                      }}
                    />
                    {/* Mask the unused portion of the first half */}
                    <View
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: half,
                        height: size,
                        backgroundColor: 'transparent',
                      }}
                    />
                  </View>
                </View>

                {/* Second half if sweep > 180 */}
                {secondSweep > 0 && (
                  <View
                    style={{
                      position: 'absolute',
                      width: size,
                      height: size,
                      transform: [{ rotate: `${arc.start + 180}deg` }],
                    }}
                  >
                    <View
                      style={{
                        position: 'absolute',
                        left: half,
                        top: 0,
                        width: half,
                        height: size,
                        overflow: 'hidden',
                      }}
                    >
                      <View
                        style={{
                          position: 'absolute',
                          left: -half,
                          top: 0,
                          width: size,
                          height: size,
                          borderRadius: half,
                          backgroundColor: arc.color,
                        }}
                      />
                    </View>
                  </View>
                )}
              </React.Fragment>
            );
          })}

          {/* Inner cutout — turns the disc into a donut */}
          <View
            style={{
              position: 'absolute',
              width: size - stroke * 2,
              height: size - stroke * 2,
              borderRadius: (size - stroke * 2) / 2,
              backgroundColor: T.card,
              top: stroke,
              left: stroke,
            }}
          />
        </View>
      );
    };

    // ─── Actually just use SVG (it DOES work — the earlier issue was
    // strokeDashoffset sign and using `strokeLinecap="butt"` with a
    // fractional dash that Android rounds). Let's use a clean,
    // well-tested implementation: ────────────────────────────────────────

    const sizeSvg = 180;
    const strokeSvg = 26;
    const radius = (sizeSvg - strokeSvg) / 2;
    const cx = sizeSvg / 2;
    const cy = sizeSvg / 2;
    const circumference = 2 * Math.PI * radius;

    let cumulative = 0;
    const svgArcs = segments.map((s) => {
      const dash = (s.pct / 100) * circumference;
      const arc = {
        key: s.key,
        color: s.color,
        dashArray: `${dash} ${circumference - dash}`,
        dashOffset: -cumulative,
      };
      cumulative += dash;
      return arc;
    });

    const top = [...qualityDistribution].sort((a, b) => b.value - a.value)[0];

    return (
      <View style={styles.pieContainer}>
        <View style={styles.pieWrapper}>
          <Svg width={sizeSvg} height={sizeSvg}>
            <Circle
              cx={cx}
              cy={cy}
              r={radius}
              stroke={T.divider}
              strokeWidth={strokeSvg}
              fill="none"
            />
            {svgArcs.map((a) => (
              <Circle
                key={a.key}
                cx={cx}
                cy={cy}
                r={radius}
                stroke={a.color}
                strokeWidth={strokeSvg}
                strokeLinecap="butt"
                strokeDasharray={a.dashArray}
                strokeDashoffset={a.dashOffset}
                fill="none"
                transform={`rotate(-90 ${cx} ${cy})`}
              />
            ))}
          </Svg>
          <View style={styles.pieCenter} pointerEvents="none">
            <Text style={[styles.pieCenterText, { color: top.color }]}>
              {top.value}%
            </Text>
            <Text style={styles.pieCenterSubtext}>{top.name}</Text>
          </View>
        </View>
      </View>
    );
  };

  // ─── TREND CHART ──────────────────────────────────────────────────────────

  const QualityTrendChart = () => {
    const maxValue = 70;
    const chartHeight = 150;
    const chartWidth = width - 80;
    const pointSpacing =
      qualityTrends.length > 1 ? chartWidth / (qualityTrends.length - 1) : chartWidth;

    const y = (value) => chartHeight - (value / maxValue) * chartHeight;

    let gradeAPath = '';
    let gradeBPath = '';
    let gradeCPath = '';

    qualityTrends.forEach((item, index) => {
      const x = index * pointSpacing;
      const yA = y(item.gradeA);
      const yB = y(item.gradeB);
      const yC = y(item.gradeC);

      if (index === 0) {
        gradeAPath = `M ${x} ${yA}`;
        gradeBPath = `M ${x} ${yB}`;
        gradeCPath = `M ${x} ${yC}`;
      } else {
        gradeAPath += ` L ${x} ${yA}`;
        gradeBPath += ` L ${x} ${yB}`;
        gradeCPath += ` L ${x} ${yC}`;
      }
    });

    return (
      <View style={styles.trendChartContainer}>
        <View style={styles.chartWrapper}>
          <Svg height={chartHeight + 30} width={chartWidth + 40}>
            {[0, 25, 50, 75].map((value) => {
              const yy = y(value);
              return (
                <G key={value}>
                  <Line
                    x1={20}
                    y1={yy}
                    x2={chartWidth + 20}
                    y2={yy}
                    stroke={T.border}
                    strokeWidth={1}
                    strokeDasharray="5,5"
                  />
                  <SvgText
                    x={10}
                    y={yy + 4}
                    fontSize={10}
                    fill={T.muted}
                    textAnchor="end"
                  >
                    {value}%
                  </SvgText>
                </G>
              );
            })}

            <Path d={gradeAPath} fill="none" stroke={T.gradeA} strokeWidth={3} strokeLinecap="round" />
            <Path d={gradeBPath} fill="none" stroke={T.gradeB} strokeWidth={3} strokeLinecap="round" />
            <Path d={gradeCPath} fill="none" stroke={T.gradeC} strokeWidth={3} strokeLinecap="round" />

            {qualityTrends.map((item, index) => {
              const x = index * pointSpacing + 20;
              return (
                <Circle
                  key={`a-${index}`}
                  cx={x}
                  cy={y(item.gradeA)}
                  r={4}
                  fill={T.gradeA}
                  stroke={T.white}
                  strokeWidth={2}
                />
              );
            })}

            {qualityTrends.map((item, index) => {
              const x = index * pointSpacing + 20;
              return (
                <SvgText
                  key={index}
                  x={x}
                  y={chartHeight + 20}
                  fontSize={11}
                  fill={T.body}
                  textAnchor="middle"
                >
                  {item.month}
                </SvgText>
              );
            })}
          </Svg>
        </View>

        <View style={styles.trendLegend}>
          <View style={styles.legendItemSmall}>
            <View style={[styles.legendColor, { backgroundColor: T.gradeA }]} />
            <Text style={styles.legendTextSmall}>Grade A</Text>
          </View>
          <View style={styles.legendItemSmall}>
            <View style={[styles.legendColor, { backgroundColor: T.gradeB }]} />
            <Text style={styles.legendTextSmall}>Grade B</Text>
          </View>
          <View style={styles.legendItemSmall}>
            <View style={[styles.legendColor, { backgroundColor: T.gradeC }]} />
            <Text style={styles.legendTextSmall}>Grade C</Text>
          </View>
        </View>
      </View>
    );
  };

  // ─── HEADER (no back button — this screen is a tab) ──────────────────────

  const Header = () => (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={T.card} />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Quality Distribution</Text>
            <Text style={styles.headerSubtitle}>Oil Grade Analysis</Text>
          </View>
        </View>
      </View>
    </>
  );

  // ─── GRADE SECTION (collapsible) ──────────────────────────────────────────

  const GradeSection = ({ grade }) => {
    const isOpen = !!expanded[grade.key];
    const hasSources = (grade.sources?.length ?? 0) > 0;

    return (
      <View style={styles.gradeSection}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => hasSources && toggleExpand(grade.key)}
          disabled={!hasSources}
        >
          <View style={[styles.gradeHeader, { backgroundColor: grade.color }]}>
            <View style={styles.gradeHeaderContent}>
              {grade.key === 'A' ? (
                <CheckCircleIcon color={T.white} size={24} />
              ) : (
                <AlertTriangleIcon color={T.white} size={24} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.gradeTitle}>{grade.name} Oil Sources</Text>
                <Text style={styles.gradeTotal}>
                  Total: {grade.totalVolume.toLocaleString()} L ({grade.value}%)
                </Text>
              </View>
              {hasSources && (
                <View style={styles.chevronWrap}>
                  <ChevronDownIcon color={T.white} size={20} open={isOpen} />
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {isOpen && hasSources && (
          <View style={styles.gradeBody}>
            {grade.sources.map((source, idx) => (
              <View key={idx} style={styles.sourceCard}>
                <View style={styles.sourceInfo}>
                  <Text style={styles.sourceName}>{source.restaurant}</Text>
                  <Text style={styles.sourceVolume}>
                    {source.volume.toLocaleString()} L
                  </Text>
                </View>
                <View style={styles.sourceBarContainer}>
                  <View
                    style={[
                      styles.sourceBar,
                      { width: `${source.percentage}%`, backgroundColor: grade.color },
                    ]}
                  />
                </View>
                <Text style={styles.sourcePercentage}>
                  {source.percentage}% of {grade.name}
                </Text>
              </View>
            ))}
          </View>
        )}

        {!isOpen && hasSources && (
          <TouchableOpacity
            style={styles.showMoreRow}
            onPress={() => toggleExpand(grade.key)}
            activeOpacity={0.7}
          >
            <Text style={styles.showMoreText}>
              Show {grade.sources.length}{' '}
              {grade.sources.length === 1 ? 'restaurant' : 'restaurants'}
            </Text>
            <ChevronDownIcon color={T.primary} size={16} open={false} />
          </TouchableOpacity>
        )}

        {!hasSources && (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>
              No {grade.name.toLowerCase()} sources recorded yet.
            </Text>
          </View>
        )}
      </View>
    );
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewTitle}>Current Pipeline Quality</Text>
          <DonutChart />

          <View style={styles.legendContainer}>
            {qualityDistribution.map((grade, index) => (
              <TouchableOpacity
                key={index}
                style={styles.legendItem}
                onPress={() => setSelectedGrade(grade.name)}
              >
                <View style={[styles.legendDot, { backgroundColor: grade.color }]} />
                <Text style={styles.legendText}>
                  {grade.name}: {grade.value}%
                </Text>
                <Text style={styles.legendVolume}>
                  {grade.totalVolume.toLocaleString()}L
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.trendsCard}>
          <Text style={styles.trendsTitle}>Quality Trends</Text>
          <Text style={styles.trendsSubtitle}>Last 4 months</Text>
          <QualityTrendChart />
        </View>

        {qualityDistribution.map((grade) => (
          <GradeSection key={grade.key} grade={grade} />
        ))}
      </ScrollView>
    </View>
  );
};

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.page },

  // Header (no back button, centered title)
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

  scrollView: { flex: 1, paddingBottom: 30 },

  overviewCard: {
    backgroundColor: T.card,
    borderRadius: R.card,
    padding: 20,
    marginHorizontal: S.screenPadding,
    marginTop: 20,
    borderWidth: 1,
    borderColor: T.border,
    ...SH.card,
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: T.ink,
    marginBottom: 16,
    textAlign: 'center',
  },

  // Pie / donut
  pieContainer: { alignItems: 'center', marginBottom: 16 },
  pieWrapper: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pieCenter: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: T.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  pieCenterText: { fontSize: 26, fontWeight: '800' },
  pieCenterSubtext: { fontSize: 11, color: T.body, marginTop: 2, fontWeight: '600' },

  legendContainer: { marginTop: 6, gap: 10 },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: T.divider,
    borderRadius: 8,
  },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  legendText: { flex: 1, fontSize: 14, fontWeight: '600', color: T.ink },
  legendVolume: { fontSize: 13, fontWeight: '700', color: T.body },

  trendsCard: {
    backgroundColor: T.card,
    borderRadius: R.card,
    padding: 20,
    marginHorizontal: S.screenPadding,
    marginTop: 16,
    borderWidth: 1,
    borderColor: T.border,
    ...SH.card,
  },
  trendsTitle: { fontSize: 16, fontWeight: '700', color: T.ink, marginBottom: 2 },
  trendsSubtitle: { fontSize: 12, color: T.body, marginBottom: 16 },
  trendChartContainer: { marginTop: 6 },
  chartWrapper: { alignItems: 'center' },
  trendLegend: { flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 16 },
  legendItemSmall: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendColor: { width: 10, height: 10, borderRadius: 5 },
  legendTextSmall: { fontSize: 12, color: T.body, fontWeight: '500' },

  gradeSection: {
    marginHorizontal: S.screenPadding,
    marginTop: 16,
    backgroundColor: T.card,
    borderRadius: R.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: T.border,
    ...SH.card,
  },
  gradeHeader: { padding: 16 },
  gradeHeaderContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  gradeTitle: { fontSize: 15, fontWeight: '700', color: T.white },
  gradeTotal: { fontSize: 12, color: T.white, opacity: 0.95, marginTop: 2 },
  chevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  gradeBody: { backgroundColor: T.card },
  sourceCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: T.divider,
  },
  sourceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sourceName: { fontSize: 14, fontWeight: '600', color: T.ink, flex: 1, paddingRight: 8 },
  sourceVolume: { fontSize: 14, fontWeight: '700', color: T.body },
  sourceBarContainer: {
    height: 8,
    backgroundColor: T.divider,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  sourceBar: { height: '100%', borderRadius: 4 },
  sourcePercentage: { fontSize: 11, color: T.muted },

  showMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: T.divider,
  },
  showMoreText: { fontSize: 13, fontWeight: '600', color: T.primary },

  emptyRow: { paddingVertical: 16, paddingHorizontal: 16 },
  emptyText: { fontSize: 12, color: T.muted, textAlign: 'center' },
});

export default QualityScreen;