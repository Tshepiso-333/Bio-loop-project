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
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, Line, Polyline, Text as SvgText } from 'react-native-svg';
import { useManufacturerContext } from '../../src/contexts/ManufacturerContext';
import { groupPickupsByMonth, computeSupplierStats } from '../../src/utils/manufacturerAnalytics';

const { width } = Dimensions.get('window');

const QualityScreen = ({ navigation, onBack }) => {
  const [selectedGrade, setSelectedGrade] = useState('all');
  const { forecasts = [], pickups = [] } = useManufacturerContext();

  const sevenDayForecast = forecasts?.find(f => f.period_days === 7);

  const groupedSources = (pickups || []).reduce((groups, p) => {
    const grade = (p.quality_grade || '').toUpperCase();
    const volume = p.estimated_volume_liters ?? p.actual_volume_liters ?? 0;
    const restaurantName = p.restaurants?.name ?? 'Unknown';

    if (grade === 'A' || grade === 'B' || grade === 'C') {
      groups[grade].push({
        restaurant: restaurantName,
        volume,
        percentage: 0,
      });
    }

    return groups;
  }, { A: [], B: [], C: [] });

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
      name: 'Grade A',
      value: sevenDayForecast?.grade_a_pct ?? 0,
      color: '#7EE92D',
      totalVolume: gradeASources.reduce((sum, item) => sum + item.volume, 0),
      sources: gradeASources,
    },
    {
      name: 'Grade B',
      value: sevenDayForecast?.grade_b_pct ?? 0,
      color: '#f59e0b',
      totalVolume: gradeBSources.reduce((sum, item) => sum + item.volume, 0),
      sources: gradeBSources,
    },
    {
      name: 'Grade C',
      value: sevenDayForecast?.grade_c_pct ?? 0,
      color: '#ef4444',
      totalVolume: gradeCSources.reduce((sum, item) => sum + item.volume, 0),
      sources: gradeCSources,
    },
  ];

  const qualityTrends = useMemo(() => groupPickupsByMonth(pickups, 4), [pickups]);

  const topGradeASuppliers = useMemo(() => {
    return computeSupplierStats(pickups)
      .filter((s) => s.quality === 'A')
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 2)
      .map((s) => s.name);
  }, [pickups]);

  const topSupplierText = topGradeASuppliers.length > 0
    ? topGradeASuppliers.join(' and ')
    : 'your top-performing suppliers';

  const gradeATrendDelta = useMemo(() => {
    if (qualityTrends.length < 2) return null;
    const pct = (bucket) => {
      const total = bucket.gradeA + bucket.gradeB + bucket.gradeC;
      return total > 0 ? (bucket.gradeA / total) * 100 : 0;
    };
    return Math.round(pct(qualityTrends[qualityTrends.length - 1]) - pct(qualityTrends[0]));
  }, [qualityTrends]);


  // Icons
  const TrendingUpIcon = ({ color = '#fff', size = 20 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="18,15 22,11 18,7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      <Polyline points="2,17 8,11 12,15 18,9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );

  const AlertTriangleIcon = ({ color = '#fff', size = 20 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 9v4M12 17h.01" stroke={color} strokeWidth={2} strokeLinecap="round"/>
      <Path d="M12 3L2 21h20L12 3z" stroke={color} strokeWidth={2} strokeLinejoin="round"/>
    </Svg>
  );

  const CheckCircleIcon = ({ color = '#fff', size = 20 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2}/>
      <Path d="M8 12L11 15L16 9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );

  // Pie Chart Component
  const PieChart = () => {
    const segments = qualityDistribution;
    let cumulativeAngle = 0;
    
    return (
      <View style={styles.pieContainer}>
        <View style={styles.pieWrapper}>
          <View style={styles.pieRing}>
            {segments.map((segment, index) => {
              const angle = (segment.value / 100) * 360;
              const startAngle = cumulativeAngle;
              cumulativeAngle += angle;
              
              return (
                <View
                  key={index}
                  style={[
                    styles.pieSegment,
                    {
                      backgroundColor: segment.color,
                      transform: [{ rotate: `${startAngle}deg` }],
                    }
                  ]}
                />
              );
            })}
          </View>
          <View style={styles.pieCenter}>
            <Text style={styles.pieCenterText}>100%</Text>
            <Text style={styles.pieCenterSubtext}>Total</Text>
          </View>
        </View>
      </View>
    );
  };

  // Line Chart for quality trends
  const QualityTrendChart = () => {
    const maxValue = 70;
    const chartHeight = 150;
    const chartWidth = width - 80;
    const pointSpacing = qualityTrends.length > 1 ? chartWidth / (qualityTrends.length - 1) : chartWidth;

    const getGradeAY = (value) => chartHeight - (value / maxValue) * chartHeight;
    const getGradeBY = (value) => chartHeight - (value / maxValue) * chartHeight;
    const getGradeCY = (value) => chartHeight - (value / maxValue) * chartHeight;

    // Create path strings for each grade
    let gradeAPath = '';
    let gradeBPath = '';
    let gradeCPath = '';
    
    qualityTrends.forEach((item, index) => {
      const x = index * pointSpacing;
      const yA = getGradeAY(item.gradeA);
      const yB = getGradeBY(item.gradeB);
      const yC = getGradeCY(item.gradeC);
      
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
            {/* Grid lines */}
            {[0, 25, 50, 75].map((value) => {
              const y = chartHeight - (value / maxValue) * chartHeight;
              return (
                <React.Fragment key={value}>
                  <Line
                    x1={20}
                    y1={y}
                    x2={chartWidth + 20}
                    y2={y}
                    stroke="#e5e7eb"
                    strokeWidth={1}
                    strokeDasharray="5,5"
                  />
                  <SvgText
                    x={10}
                    y={y + 4}
                    fontSize={10}
                    fill="#9ca3af"
                    textAnchor="end"
                  >
                    {value}%
                  </SvgText>
                </React.Fragment>
              );
            })}
            
            {/* Grade A Line */}
            <Path
              d={gradeAPath}
              fill="none"
              stroke="#7EE92D"
              strokeWidth={3}
              strokeLinecap="round"
            />
            
            {/* Grade B Line */}
            <Path
              d={gradeBPath}
              fill="none"
              stroke="#f59e0b"
              strokeWidth={3}
              strokeLinecap="round"
            />
            
            {/* Grade C Line */}
            <Path
              d={gradeCPath}
              fill="none"
              stroke="#ef4444"
              strokeWidth={3}
              strokeLinecap="round"
            />
            
            {/* Data points for Grade A */}
            {qualityTrends.map((item, index) => {
              const x = index * pointSpacing + 20;
              const yA = getGradeAY(item.gradeA);
              return (
                <Circle
                  key={`a-${index}`}
                  cx={x}
                  cy={yA}
                  r={4}
                  fill="#7EE92D"
                  stroke="#fff"
                  strokeWidth={2}
                />
              );
            })}
            
            {/* X-axis labels */}
            {qualityTrends.map((item, index) => {
              const x = index * pointSpacing + 20;
              return (
                <SvgText
                  key={index}
                  x={x}
                  y={chartHeight + 20}
                  fontSize={11}
                  fill="#6b7280"
                  textAnchor="middle"
                >
                  {item.month}
                </SvgText>
              );
            })}
          </Svg>
        </View>
        
        {/* Legend */}
        <View style={styles.trendLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#7EE92D' }]} />
            <Text style={styles.legendText}>Grade A</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#f59e0b' }]} />
            <Text style={styles.legendText}>Grade B</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.legendText}>Grade C</Text>
          </View>
        </View>
      </View>
    );
  };

  // Header Component - Updated to fill to the top
  const Header = () => (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#059669" />
      <LinearGradient
        colors={['#10b981', '#059669', '#047857']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              if (onBack) {
                onBack();
              } else {
                navigation.goBack();
              }
            }}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Quality Distribution</Text>
            <Text style={styles.headerSubtitle}>Oil Grade Analysis</Text>
          </View>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>
    </>
  );

  return (
    <View style={styles.container}>
      <Header />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        {/* Overview Card */}
        <View style={styles.overviewCard}>
          <Text style={styles.overviewTitle}>Current Pipeline Quality</Text>
          <PieChart />
          
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
                <Text style={styles.legendVolume}>{grade.totalVolume.toLocaleString()}L</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quality Trends Over Time */}
        <View style={styles.trendsCard}>
          <Text style={styles.trendsTitle}>Quality Trends</Text>
          <Text style={styles.trendsSubtitle}>Last 4 months</Text>
          <QualityTrendChart />
        </View>

        {/* Grade A Sources */}
        <View style={styles.gradeSection}>
          <LinearGradient
            colors={['#7EE92D', '#5cb85c']}
            style={styles.gradeHeader}
          >
            <View style={styles.gradeHeaderContent}>
              <CheckCircleIcon color="#fff" size={24} />
              <View>
                <Text style={styles.gradeTitle}>Grade A Oil Sources</Text>
                <Text style={styles.gradeTotal}>Total: {qualityDistribution[0].totalVolume.toLocaleString()} L ({qualityDistribution[0].value}%)</Text>
              </View>
            </View>
          </LinearGradient>
          
          {(qualityDistribution[0]?.sources ?? []).map((source, idx) => (
            <View key={idx} style={styles.sourceCard}>
              <View style={styles.sourceInfo}>
                <Text style={styles.sourceName}>{source.restaurant}</Text>
                <Text style={styles.sourceVolume}>{source.volume.toLocaleString()} L</Text>
              </View>
              <View style={styles.sourceBarContainer}>
                <View style={[styles.sourceBar, { width: `${source.percentage}%`, backgroundColor: '#7EE92D' }]} />
              </View>
              <Text style={styles.sourcePercentage}>{source.percentage}% of Grade A</Text>
            </View>
          ))}
        </View>

        {/* Grade B Sources */}
        <View style={styles.gradeSection}>
          <LinearGradient
            colors={['#f59e0b', '#d97706']}
            style={styles.gradeHeader}
          >
            <View style={styles.gradeHeaderContent}>
              <AlertTriangleIcon color="#fff" size={24} />
              <View>
                <Text style={styles.gradeTitle}>Grade B Oil Sources</Text>
                <Text style={styles.gradeTotal}>Total: {qualityDistribution[1].totalVolume.toLocaleString()} L ({qualityDistribution[1].value}%)</Text>
              </View>
            </View>
          </LinearGradient>
          
          {(qualityDistribution[1]?.sources ?? []).map((source, idx) => (
            <View key={idx} style={styles.sourceCard}>
              <View style={styles.sourceInfo}>
                <Text style={styles.sourceName}>{source.restaurant}</Text>
                <Text style={styles.sourceVolume}>{source.volume.toLocaleString()} L</Text>
              </View>
              <View style={styles.sourceBarContainer}>
                <View style={[styles.sourceBar, { width: `${source.percentage}%`, backgroundColor: '#f59e0b' }]} />
              </View>
              <Text style={styles.sourcePercentage}>{source.percentage}% of Grade B</Text>
            </View>
          ))}
        </View>

        {/* Grade C Sources */}
        <View style={styles.gradeSection}>
          <LinearGradient
            colors={['#ef4444', '#dc2626']}
            style={styles.gradeHeader}
          >
            <View style={styles.gradeHeaderContent}>
              <AlertTriangleIcon color="#fff" size={24} />
              <View>
                <Text style={styles.gradeTitle}>Grade C Oil Sources</Text>
                <Text style={styles.gradeTotal}>Total: {qualityDistribution[2].totalVolume.toLocaleString()} L ({qualityDistribution[2].value}%)</Text>
              </View>
            </View>
          </LinearGradient>
          
          {(qualityDistribution[2]?.sources ?? []).map((source, idx) => (
            <View key={idx} style={styles.sourceCard}>
              <View style={styles.sourceInfo}>
                <Text style={styles.sourceName}>{source.restaurant}</Text>
                <Text style={styles.sourceVolume}>{source.volume.toLocaleString()} L</Text>
              </View>
              <View style={styles.sourceBarContainer}>
                <View style={[styles.sourceBar, { width: `${source.percentage}%`, backgroundColor: '#ef4444' }]} />
              </View>
              <Text style={styles.sourcePercentage}>{source.percentage}% of Grade C</Text>
            </View>
          ))}
        </View>

        {/* Recommendation Card */}
        <View style={styles.recommendationCard}>
          <LinearGradient
            colors={['#1a1a2e', '#16213e']}
            style={styles.recommendationGradient}
          >
            <TrendingUpIcon color="#7EE92D" size={28} />
            <Text style={styles.recommendationTitle}>Quality Improvement Suggestion</Text>
            <Text style={styles.recommendationText}>
              Grade A quality has {gradeATrendDelta === null ? 'been tracked' : `changed by ${gradeATrendDelta >= 0 ? '+' : ''}${gradeATrendDelta}%`} over the last 4 months.
              Schedule more pickups from {topSupplierText} to maintain high-quality standards. Grade C oil can be processed
              for industrial use.
            </Text>
          </LinearGradient>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingTop: 48,
    paddingBottom: 16,
  },
  headerContent: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '600',
  },
  headerTextContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  overviewCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  pieContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  pieWrapper: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pieRing: {
    width: 180,
    height: 180,
    borderRadius: 90,
    position: 'relative',
    overflow: 'hidden',
  },
  pieSegment: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  pieCenter: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    top: 35,
    left: 35,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pieCenterText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  pieCenterSubtext: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  legendContainer: {
    marginTop: 10,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  legendVolume: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  trendsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    marginTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  trendsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  trendsSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 20,
  },
  trendChartContainer: {
    marginTop: 10,
  },
  chartWrapper: {
    alignItems: 'center',
  },
  trendLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 20,
  },
  gradeSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  gradeHeader: {
    padding: 16,
  },
  gradeHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  gradeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  gradeTotal: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    marginTop: 2,
  },
  sourceCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sourceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sourceName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  sourceVolume: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  sourceBarContainer: {
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  sourceBar: {
    height: '100%',
    borderRadius: 4,
  },
  sourcePercentage: {
    fontSize: 11,
    color: '#9ca3af',
  },
  recommendationCard: {
    margin: 16,
    marginBottom: 30,
    borderRadius: 16,
    overflow: 'hidden',
  },
  recommendationGradient: {
    padding: 20,
    alignItems: 'center',
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  recommendationText: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default QualityScreen;