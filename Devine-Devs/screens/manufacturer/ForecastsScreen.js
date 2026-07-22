// screens/manufacturer/ForecastsScreen.js
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
import Svg, { Path, Circle, Rect, Line, Polyline, G, Text as SvgText } from 'react-native-svg';
import { useManufacturerContext } from '../../src/contexts/ManufacturerContext';
import { groupPickupsByDay } from '../../src/utils/manufacturerAnalytics';

const { width } = Dimensions.get('window');

const ForecastsScreen = ({ navigation }) => {
  const [forecastPeriod, setForecastPeriod] = useState('7days');
  const { forecasts = [], pickups = [] } = useManufacturerContext();

  // Get real forecasts data by period or use empty placeholder
  const getForecastByPeriod = (period) => {
    const days = period === '7days' ? 7 : period === '14days' ? 14 : 30;
    const forecast = forecasts.find(f => f.period_days === days);
    
    if (forecast) {
      return {
        total: forecast.total_volume_liters ?? 0,
        gradeA: forecast.grade_a_pct ?? 0,
        gradeB: forecast.grade_b_pct ?? 0,
        gradeC: forecast.grade_c_pct ?? 0,
        trend: forecast.trend_label ?? '—',
        confidence: forecast.confidence_pct ?? 0,
      };
    }
    return { total: 0, gradeA: 0, gradeB: 0, gradeC: 0, trend: '—', confidence: 0 };
  };

  // AI Forecast Data mapped from context
  const forecastData = {
    '7days': getForecastByPeriod('7days'),
    '14days': getForecastByPeriod('14days'),
    '30days': getForecastByPeriod('30days'),
  };

  // Historical/daily data derived from the manufacturer's own pickups (last 7 calendar days)
  const historicalData = useMemo(() => groupPickupsByDay(pickups, 7), [pickups]);


  // Icons
  const TrendingUpIcon = ({ color = '#fff', size = 24 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="18,15 22,11 18,7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      <Polyline points="2,17 8,11 12,15 18,9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );

  const CalendarIcon = ({ color = '#fff', size = 20 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth={1.6}/>
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth={1.6} strokeLinecap="round"/>
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth={1.6} strokeLinecap="round"/>
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth={1.6}/>
    </Svg>
  );

  const BrainIcon = ({ color = '#fff', size = 24 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 4a4 4 0 014 4c0 1.5-.8 2.8-2 3.5V14h-4v-2.5c-1.2-.7-2-2-2-3.5a4 4 0 014-4z" stroke={color} strokeWidth={1.6} fill="none"/>
      <Path d="M9 12c-1.7 0-3 1.3-3 3v2h12v-2c0-1.7-1.3-3-3-3" stroke={color} strokeWidth={1.6} fill="none"/>
      <Circle cx="9" cy="9" r="1.5" fill={color} stroke="none"/>
      <Circle cx="15" cy="9" r="1.5" fill={color} stroke="none"/>
    </Svg>
  );

  const ArrowUpIcon = ({ color = '#fff', size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12l7-7 7 7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );

  // Forecast Line Chart Component
  const ForecastChart = () => {
    const data = forecastData[forecastPeriod].daily || historicalData;
    const chartData = data.length > 0 ? data : historicalData;
    const maxVolume = Math.max(...chartData.map(d => d.volume || 0), 1);
    const chartHeight = 180;
    const chartWidth = width - 80;
    const pointSpacing = chartData.length > 1 ? chartWidth / (chartData.length - 1) : chartWidth;
    
    const getY = (volume) => chartHeight - (volume / maxVolume) * chartHeight;
    
    let volumePath = '';
    let gradeAPath = '';
    
    chartData.forEach((item, index) => {
      const x = index * pointSpacing + 20;
      const yVolume = getY(item.volume || 0);
      
      if (index === 0) {
        volumePath = `M ${x} ${yVolume}`;
      } else {
        volumePath += ` L ${x} ${yVolume}`;
      }
    });
    
    // Grade A trend line (if available)
    if (chartData[0]?.gradeA) {
      const maxGrade = 70;
      chartData.forEach((item, index) => {
        const x = index * pointSpacing + 20;
        const yGrade = chartHeight - ((item.gradeA || 0) / maxGrade) * chartHeight;
        
        if (index === 0) {
          gradeAPath = `M ${x} ${yGrade}`;
        } else {
          gradeAPath += ` L ${x} ${yGrade}`;
        }
      });
    }
    
    return (
      <View style={styles.chartContainer}>
        <Svg height={chartHeight + 50} width={chartWidth + 40}>
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((value) => {
            const y = chartHeight - (value / 100) * chartHeight;
            const volumeLabel = Math.round(maxVolume * (value / 100));
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
                  x={15}
                  y={y + 4}
                  fontSize={10}
                  fill="#9ca3af"
                  textAnchor="end"
                >
                  {volumeLabel}L
                </SvgText>
              </React.Fragment>
            );
          })}
          
          {/* Volume line */}
          <Path
            d={volumePath}
            fill="none"
            stroke="#10b981"
            strokeWidth={3}
            strokeLinecap="round"
          />
          
          {/* Grade A trend line */}
          {gradeAPath && (
            <Path
              d={gradeAPath}
              fill="none"
              stroke="#7EE92D"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeDasharray="6,4"
            />
          )}
          
          {/* Area under the curve */}
          <Path
            d={`${volumePath} L ${chartWidth + 20} ${chartHeight} L 20 ${chartHeight} Z`}
            fill="#10b981"
            opacity="0.1"
          />
          
          {/* Data points */}
          {data.map((item, index) => {
            const x = index * pointSpacing + 20;
            const yVolume = getY(item.volume || item.volume);
            return (
              <Circle
                key={index}
                cx={x}
                cy={yVolume}
                r={4}
                fill="#10b981"
                stroke="#fff"
                strokeWidth={2}
              />
            );
          })}
          
          {/* X-axis labels */}
          {data.map((item, index) => {
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
                {item.day || item.week}
              </SvgText>
            );
          })}
        </Svg>
        
        {/* Chart Legend */}
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: '#10b981' }]} />
            <Text style={styles.legendText}>Forecast Volume</Text>
          </View>
          {gradeAPath && (
            <View style={styles.legendItem}>
              <View style={[styles.legendLine, { backgroundColor: '#7EE92D', borderStyle: 'dashed' }]} />
              <Text style={styles.legendText}>Grade A Trend</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Header Component - Updated to fill to the top and navigate to home
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
            onPress={() => navigation.navigate('ManufacturerDashboardScreen')}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>AI Supply Forecasts</Text>
            <Text style={styles.headerSubtitle}>Powered by Machine Learning</Text>
          </View>
          <BrainIcon color="#fff" size={24} />
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
        {/* Period Selector */}
        <View style={styles.periodContainer}>
          <TouchableOpacity 
            style={[styles.periodBtn, forecastPeriod === '7days' && styles.activePeriodBtn]}
            onPress={() => setForecastPeriod('7days')}
          >
            <CalendarIcon color={forecastPeriod === '7days' ? '#fff' : '#6b7280'} size={18} />
            <Text style={[styles.periodText, forecastPeriod === '7days' && styles.activePeriodText]}>7 Days</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.periodBtn, forecastPeriod === '14days' && styles.activePeriodBtn]}
            onPress={() => setForecastPeriod('14days')}
          >
            <CalendarIcon color={forecastPeriod === '14days' ? '#fff' : '#6b7280'} size={18} />
            <Text style={[styles.periodText, forecastPeriod === '14days' && styles.activePeriodText]}>14 Days</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.periodBtn, forecastPeriod === '30days' && styles.activePeriodBtn]}
            onPress={() => setForecastPeriod('30days')}
          >
            <CalendarIcon color={forecastPeriod === '30days' ? '#fff' : '#6b7280'} size={18} />
            <Text style={[styles.periodText, forecastPeriod === '30days' && styles.activePeriodText]}>30 Days</Text>
          </TouchableOpacity>
        </View>

        {/* Main Forecast Card */}
        <LinearGradient
          colors={['#1a1a2e', '#16213e']}
          style={styles.mainForecastCard}
        >
          <View style={styles.mainForecastHeader}>
            <TrendingUpIcon color="#7EE92D" size={28} />
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceText}>
                {forecastData[forecastPeriod].confidence}% Confidence
              </Text>
            </View>
          </View>
          
          <Text style={styles.mainForecastTotal}>
            {forecastData[forecastPeriod].total.toLocaleString()} L
          </Text>
          <Text style={styles.mainForecastTrend}>
            <ArrowUpIcon color="#7EE92D" size={14} /> {forecastData[forecastPeriod].trend} from previous period
          </Text>
          
          {/* Forecast Chart */}
          <ForecastChart />
          
          {/* Quality Breakdown */}
          <View style={styles.qualityBreakdown}>
            <Text style={styles.qualityBreakdownTitle}>Expected Quality Mix</Text>
            
            <View style={styles.qualityBarItem}>
              <View style={styles.qualityBarHeader}>
                <Text style={styles.qualityBarLabel}>Grade A</Text>
                <Text style={styles.qualityBarPercent}>{forecastData[forecastPeriod].gradeA}%</Text>
              </View>
              <View style={styles.qualityBarBg}>
                <View style={[styles.qualityBarFill, { width: `${forecastData[forecastPeriod].gradeA}%`, backgroundColor: '#7EE92D' }]} />
              </View>
            </View>
            
            <View style={styles.qualityBarItem}>
              <View style={styles.qualityBarHeader}>
                <Text style={styles.qualityBarLabel}>Grade B</Text>
                <Text style={styles.qualityBarPercent}>{forecastData[forecastPeriod].gradeB}%</Text>
              </View>
              <View style={styles.qualityBarBg}>
                <View style={[styles.qualityBarFill, { width: `${forecastData[forecastPeriod].gradeB}%`, backgroundColor: '#f59e0b' }]} />
              </View>
            </View>
            
            <View style={styles.qualityBarItem}>
              <View style={styles.qualityBarHeader}>
                <Text style={styles.qualityBarLabel}>Grade C</Text>
                <Text style={styles.qualityBarPercent}>{forecastData[forecastPeriod].gradeC}%</Text>
              </View>
              <View style={styles.qualityBarBg}>
                <View style={[styles.qualityBarFill, { width: `${forecastData[forecastPeriod].gradeC}%`, backgroundColor: '#ef4444' }]} />
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* AI Insights Card */}
        <LinearGradient
          colors={['#10b981', '#059669']}
          style={styles.insightCard}
        >
          <BrainIcon color="#fff" size={32} />
          <Text style={styles.insightTitle}>AI Insight</Text>
          <Text style={styles.insightText}>
            Grade A quality is projected to reach {forecastData[forecastPeriod].gradeA}% over the next {forecastPeriod === '7days' ? 'week' : forecastPeriod === '14days' ? 'two weeks' : 'month'}. 
            This represents a {forecastData[forecastPeriod].trend} increase driven by seasonal patterns and improved supplier performance.
          </Text>
        </LinearGradient>

        {/* Production Recommendation */}
        <View style={styles.recommendationCard}>
          <Text style={styles.recommendationTitle}>📊 Production Recommendation</Text>
          <Text style={styles.recommendationText}>
            Based on {forecastPeriod === '7days' ? '7-day' : forecastPeriod === '14days' ? '14-day' : '30-day'} forecast:
          </Text>
          <View style={styles.recommendationList}>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                Schedule processing runs on Tuesdays and Thursdays for optimal Grade A utilization
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                Grade C processing recommended for industrial biodiesel production
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                Increase storage capacity by 15% to accommodate peak forecast
              </Text>
            </View>
          </View>
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>+{forecastData[forecastPeriod].trend}</Text>
            <Text style={styles.metricLabel}>Growth Rate</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{forecastData[forecastPeriod].gradeA}%</Text>
            <Text style={styles.metricLabel}>Quality Score</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{forecastData[forecastPeriod].confidence}%</Text>
            <Text style={styles.metricLabel}>Accuracy</Text>
          </View>
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
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#fff',
    opacity: 0.9,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  periodContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 16,
  },
  periodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activePeriodBtn: {
    backgroundColor: '#10b981',
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  activePeriodText: {
    color: '#fff',
  },
  mainForecastCard: {
    margin: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  mainForecastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  confidenceBadge: {
    backgroundColor: '#7EE92D20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    color: '#7EE92D',
    fontWeight: '500',
  },
  mainForecastTotal: {
    fontSize: 40,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  mainForecastTrend: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 20,
  },
  chartContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendLine: {
    width: 20,
    height: 2,
    borderRadius: 1,
  },
  legendText: {
    fontSize: 11,
    color: '#9ca3af',
  },
  qualityBreakdown: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#ffffff20',
  },
  qualityBreakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  qualityBarItem: {
    marginBottom: 16,
  },
  qualityBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  qualityBarLabel: {
    fontSize: 13,
    color: '#9ca3af',
  },
  qualityBarPercent: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  qualityBarBg: {
    height: 8,
    backgroundColor: '#ffffff20',
    borderRadius: 4,
    overflow: 'hidden',
  },
  qualityBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  insightCard: {
    margin: 16,
    marginTop: 0,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  insightTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 12,
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.95,
    textAlign: 'center',
    lineHeight: 20,
  },
  recommendationCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  recommendationText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  recommendationList: {
    gap: 10,
  },
  bulletPoint: {
    flexDirection: 'row',
    gap: 8,
  },
  bullet: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 30,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
});

export default ForecastsScreen;