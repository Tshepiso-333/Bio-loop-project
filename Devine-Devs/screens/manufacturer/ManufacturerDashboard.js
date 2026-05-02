import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  TextInput,
  Platform,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Line, Rect, Polyline, G, Text as SvgText } from 'react-native-svg';

const { width } = Dimensions.get('window');

const ManufacturerDashboard = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('home');
  const [forecastPeriod, setForecastPeriod] = useState('7days');
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { id: 1, text: "Hello! I'm your AI assistant. How can I help you today?", isUser: false, time: '10:30 AM' },
  ]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  // Mock data
  const currentStock = 24580;
  const stockIncrease = 12;
  const thisWeekVolume = 11500;
  const weeklyDeliveries = 8;
  
  const weeklyData = [
    { day: 'Mon', volume: 1200 },
    { day: 'Tue', volume: 1800 },
    { day: 'Wed', volume: 1500 },
    { day: 'Thu', volume: 2200 },
    { day: 'Fri', volume: 1900 },
    { day: 'Sat', volume: 1600 },
    { day: 'Sun', volume: 1400 },
  ];

  // AI Forecast Data
  const forecastData = {
    '7days': { total: 12450, gradeA: 52, gradeB: 34, gradeC: 14, trend: '+8%' },
    '14days': { total: 25890, gradeA: 54, gradeB: 33, gradeC: 13, trend: '+12%' },
    '30days': { total: 53200, gradeA: 56, gradeB: 32, gradeC: 12, trend: '+15%' },
  };

  // Quality Distribution with source details
  const qualityDistribution = [
    { name: 'Grade A', value: 58, color: '#7EE92D', sources: [
      { restaurant: 'Golden Dragon Restaurant', volume: 2450, percentage: 42 },
      { restaurant: 'Spice Junction', volume: 1670, percentage: 29 },
      { restaurant: 'Urban Bistro', volume: 980, percentage: 17 },
      { restaurant: 'Others', volume: 700, percentage: 12 },
    ]},
    { name: 'Grade B', value: 32, color: '#f59e0b', sources: [
      { restaurant: 'Bella Italia Bistro', volume: 1890, percentage: 59 },
      { restaurant: 'Urban Bistro', volume: 450, percentage: 14 },
      { restaurant: 'Others', volume: 860, percentage: 27 },
    ]},
    { name: 'Grade C', value: 10, color: '#ef4444', sources: [
      { restaurant: 'Various Small Vendors', volume: 580, percentage: 58 },
      { restaurant: 'Bella Italia Bistro', volume: 220, percentage: 22 },
      { restaurant: 'Others', volume: 200, percentage: 20 },
    ]},
  ];

  const suppliersList = [
    { 
      name: 'Golden Dragon Restaurant', 
      volume: 2450, 
      quality: 'A', 
      reliability: 98, 
      deliveries: 24, 
      lastDelivery: 'Today',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=80&h=80&fit=crop',
      cuisine: 'Chinese',
    },
    { 
      name: 'Bella Italia Bistro', 
      volume: 1890, 
      quality: 'B', 
      reliability: 92, 
      deliveries: 18, 
      lastDelivery: 'Yesterday',
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=80&h=80&fit=crop',
      cuisine: 'Italian',
    },
    { 
      name: 'Spice Junction', 
      volume: 1670, 
      quality: 'A', 
      reliability: 96, 
      deliveries: 21, 
      lastDelivery: 'Today',
      image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=80&h=80&fit=crop',
      cuisine: 'Indian',
    },
    { 
      name: 'Urban Bistro', 
      volume: 1430, 
      quality: 'B', 
      reliability: 88, 
      deliveries: 15, 
      lastDelivery: '2 days ago',
      image: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=80&h=80&fit=crop',
      cuisine: 'Contemporary',
    },
  ];

  const upcomingDeliveries = [
    { id: 1, restaurant: 'Golden Dragon Restaurant', volume: 450, quality: 'A', eta: '10:30 AM', status: 'in-transit' },
    { id: 2, restaurant: 'Bella Italia Bistro', volume: 320, quality: 'B', eta: '11:45 AM', status: 'scheduled' },
    { id: 3, restaurant: 'Spice Junction', volume: 580, quality: 'A', eta: '02:15 PM', status: 'scheduled' },
  ];

  // Sustainability Report Data
  const sustainabilityData = {
    co2Avoided: 184.5,
    wasteOilDiverted: 24580,
    fossilDieselDisplaced: 18920,
    treesPlantedEquivalent: 845,
  };

  const getQualityColor = (quality) => {
    switch(quality) {
      case 'A': return '#7EE92D';
      case 'B': return '#f59e0b';
      case 'C': return '#ef4444';
      default: return '#7EE92D';
    }
  };

  const getQualityBgColor = (quality) => {
    switch(quality) {
      case 'A': return '#7EE92D20';
      case 'B': return '#f59e0b20';
      case 'C': return '#ef444420';
      default: return '#7EE92D20';
    }
  };

  // Professional SVG Icon Components
  const HomeIcon = ({ color = '#fff', size = 22 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" stroke={color} strokeWidth={1.6} strokeLinejoin="round"/>
      <Path d="M9 21V12h6v9" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );

  const ChatIcon = ({ color = '#fff', size = 22 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );

  const LeafIcon = ({ color = '#fff', size = 22 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );

  const BellIcon = ({ color = '#fff', size = 22 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M13.73 21a2 2 0 01-3.46 0" stroke={color} strokeWidth={1.6} strokeLinecap="round"/>
    </Svg>
  );

  const UsersIcon = ({ color = '#fff', size = 22 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth={1.6}/>
      <Path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke={color} strokeWidth={1.6} strokeLinecap="round"/>
      <Path d="M16 3.13a4 4 0 010 7.75" stroke={color} strokeWidth={1.6} strokeLinecap="round"/>
    </Svg>
  );

  const TrendingIcon = ({ color = '#fff', size = 20 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="18,15 22,11 18,7" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
      <Polyline points="2,17 8,11 12,15 18,9" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );

  const DropletsIcon = ({ color = '#fff', size = 20 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" stroke={color} strokeWidth={1.6} fill="none"/>
      <Path d="M12 6v6" stroke={color} strokeWidth={1.6} strokeLinecap="round"/>
    </Svg>
  );

  const PackageIcon = ({ color = '#fff', size = 20 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="7" width="20" height="14" rx="1" stroke={color} strokeWidth={1.6}/>
      <Path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke={color} strokeWidth={1.6} strokeLinecap="round"/>
    </Svg>
  );

  const AlertTriangleIcon = ({ color = '#fff', size = 20 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 9v4M12 17h.01" stroke={color} strokeWidth={1.6} strokeLinecap="round"/>
      <Path d="M12 3L2 21h20L12 3z" stroke={color} strokeWidth={1.6} strokeLinejoin="round"/>
    </Svg>
  );

  const ChartIcon = ({ color = '#fff', size = 22 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth={1.6}/>
      <Line x1="3" y1="9" x2="21" y2="9" stroke={color} strokeWidth={1.6}/>
      <Line x1="9" y1="21" x2="9" y2="12" stroke={color} strokeWidth={1.6}/>
      <Line x1="15" y1="21" x2="15" y2="12" stroke={color} strokeWidth={1.6}/>
      <Line x1="21" y1="21" x2="21" y2="16" stroke={color} strokeWidth={1.6}/>
      <Line x1="3" y1="21" x2="3" y2="16" stroke={color} strokeWidth={1.6}/>
    </Svg>
  );

  // BioLoop Logo Component
  const BioLoopLogo = ({ size = 40 }) => (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Circle cx="50" cy="50" r="45" fill="#10b981" opacity="0.15"/>
      <Circle cx="50" cy="50" r="35" stroke="#10b981" strokeWidth="2.5" fill="none"/>
      <Path d="M50 15 L50 85" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round"/>
      <Path d="M25 35 L75 65" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round"/>
      <Path d="M25 65 L75 35" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round"/>
      <Circle cx="50" cy="50" r="8" fill="#10b981"/>
      <Path d="M50 20 A30 30 0 0 1 80 50" stroke="#7EE92D" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <Path d="M50 80 A30 30 0 0 1 20 50" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <Path d="M35 35 L65 65" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
    </Svg>
  );

  // Correct Pie Chart Component (58% Green, 32% Orange, 10% Red)
  const PieChart = () => {
    const segments = [
      { percentage: 58, color: '#7EE92D', label: 'Grade A' },
      { percentage: 32, color: '#f59e0b', label: 'Grade B' },
      { percentage: 10, color: '#ef4444', label: 'Grade C' },
    ];
    
    let cumulativeAngle = 0;
    
    return (
      <View style={styles.pieContainer}>
        <View style={styles.pieWrapper}>
          <View style={styles.pieRing}>
            {segments.map((segment, index) => {
              const angle = (segment.percentage / 100) * 360;
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

  // Quality Distribution Page - Shows where each grade comes from
  const renderQualityDistributionPage = () => (
    <View style={styles.tabContent}>
      <LinearGradient
        colors={['#7EE92D', '#5cb85c']}
        style={styles.tabHeaderGradient}
      >
        <Text style={styles.tabHeaderTitle}>Quality Distribution</Text>
        <Text style={styles.tabHeaderSubtitle}>Where our oil grades come from</Text>
      </LinearGradient>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Pie Chart Overview */}
        <View style={styles.pieOverviewCard}>
          <Text style={styles.pieOverviewTitle}>Current Pipeline Quality</Text>
          <PieChart />
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#7EE92D' }]} /><Text style={styles.legendText}>Grade A: 58%</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} /><Text style={styles.legendText}>Grade B: 32%</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} /><Text style={styles.legendText}>Grade C: 10%</Text></View>
          </View>
        </View>

        {/* Grade A Sources */}
        <View style={styles.gradeSection}>
          <LinearGradient colors={['#7EE92D', '#5cb85c']} style={styles.gradeHeader}>
            <Text style={styles.gradeTitle}>Grade A Oil Sources</Text>
            <Text style={styles.gradeTotal}>Total: 5,800 L (58%)</Text>
          </LinearGradient>
          {qualityDistribution[0].sources.map((source, idx) => (
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
          <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.gradeHeader}>
            <Text style={styles.gradeTitle}>Grade B Oil Sources</Text>
            <Text style={styles.gradeTotal}>Total: 3,200 L (32%)</Text>
          </LinearGradient>
          {qualityDistribution[1].sources.map((source, idx) => (
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
          <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.gradeHeader}>
            <Text style={styles.gradeTitle}>Grade C Oil Sources</Text>
            <Text style={styles.gradeTotal}>Total: 1,000 L (10%)</Text>
          </LinearGradient>
          {qualityDistribution[2].sources.map((source, idx) => (
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
      </ScrollView>
    </View>
  );

  // Forecasts Page
  const renderForecastsPage = () => (
    <View style={styles.tabContent}>
      <LinearGradient
        colors={['#f59e0b', '#d97706']}
        style={styles.tabHeaderGradient}
      >
        <Text style={styles.tabHeaderTitle}>AI Supply Forecasts</Text>
        <Text style={styles.tabHeaderSubtitle}>Powered by Time-Series ML Model</Text>
      </LinearGradient>
      
      <ScrollView showsVerticalScrollIndicator={false} style={styles.forecastsContainer}>
        {/* Period Selector */}
        <View style={styles.forecastPeriodContainer}>
          <TouchableOpacity 
            style={[styles.forecastPeriodBtnLarge, forecastPeriod === '7days' && styles.activeForecastPeriodLarge]}
            onPress={() => setForecastPeriod('7days')}
          >
            <Text style={[styles.forecastPeriodTextLarge, forecastPeriod === '7days' && styles.activeForecastPeriodTextLarge]}>7 Days</Text>
            <Text style={styles.forecastPeriodValue}>{forecastData['7days'].total.toLocaleString()} L</Text>
            <Text style={styles.forecastPeriodTrend}>{forecastData['7days'].trend}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.forecastPeriodBtnLarge, forecastPeriod === '14days' && styles.activeForecastPeriodLarge]}
            onPress={() => setForecastPeriod('14days')}
          >
            <Text style={[styles.forecastPeriodTextLarge, forecastPeriod === '14days' && styles.activeForecastPeriodTextLarge]}>14 Days</Text>
            <Text style={styles.forecastPeriodValue}>{forecastData['14days'].total.toLocaleString()} L</Text>
            <Text style={styles.forecastPeriodTrend}>{forecastData['14days'].trend}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.forecastPeriodBtnLarge, forecastPeriod === '30days' && styles.activeForecastPeriodLarge]}
            onPress={() => setForecastPeriod('30days')}
          >
            <Text style={[styles.forecastPeriodTextLarge, forecastPeriod === '30days' && styles.activeForecastPeriodTextLarge]}>30 Days</Text>
            <Text style={styles.forecastPeriodValue}>{forecastData['30days'].total.toLocaleString()} L</Text>
            <Text style={styles.forecastPeriodTrend}>{forecastData['30days'].trend}</Text>
          </TouchableOpacity>
        </View>

        {/* Detailed Forecast Card */}
        <LinearGradient
          colors={['#1a1a2e', '#16213e']}
          style={styles.forecastDetailCard}
        >
          <View style={styles.forecastHeader}>
            <TrendingIcon color="#7EE92D" size={24} />
            <Text style={styles.forecastBadge}>AI Prediction • Updated Today</Text>
          </View>
          <Text style={[styles.forecastTotalValue, { color: '#ffffff' }]}>{forecastData[forecastPeriod].total.toLocaleString()} L</Text>
          <Text style={styles.forecastTrend}>{forecastData[forecastPeriod].trend} from current period</Text>
          
          <View style={styles.forecastDistributionLarge}>
            <Text style={styles.forecastDistTitle}>Expected Quality Breakdown</Text>
            <View style={styles.forecastDistItem}>
              <View style={styles.forecastDistHeader}>
                <Text style={styles.forecastDistLabel}>Grade A</Text>
                <Text style={styles.forecastDistPercent}>{forecastData[forecastPeriod].gradeA}%</Text>
              </View>
              <View style={[styles.forecastDistBarLarge, { width: `${forecastData[forecastPeriod].gradeA}%`, backgroundColor: '#7EE92D' }]} />
            </View>
            <View style={styles.forecastDistItem}>
              <View style={styles.forecastDistHeader}>
                <Text style={styles.forecastDistLabel}>Grade B</Text>
                <Text style={styles.forecastDistPercent}>{forecastData[forecastPeriod].gradeB}%</Text>
              </View>
              <View style={[styles.forecastDistBarLarge, { width: `${forecastData[forecastPeriod].gradeB}%`, backgroundColor: '#f59e0b' }]} />
            </View>
            <View style={styles.forecastDistItem}>
              <View style={styles.forecastDistHeader}>
                <Text style={styles.forecastDistLabel}>Grade C</Text>
                <Text style={styles.forecastDistPercent}>{forecastData[forecastPeriod].gradeC}%</Text>
              </View>
              <View style={[styles.forecastDistBarLarge, { width: `${forecastData[forecastPeriod].gradeC}%`, backgroundColor: '#ef4444' }]} />
            </View>
          </View>

          <View style={styles.forecastInsight}>
            <Text style={styles.forecastInsightText}>📊 AI Insight: Grade A quality expected to increase by 4% over next 30 days based on seasonal patterns</Text>
          </View>
        </LinearGradient>

        {/* Recommendation Card */}
        <View style={styles.recommendationCard}>
          <Text style={styles.recommendationTitle}>Production Recommendation</Text>
          <Text style={styles.recommendationText}>
            Based on {forecastPeriod === '7days' ? '7-day' : forecastPeriod === '14days' ? '14-day' : '30-day'} forecast, 
            schedule processing runs on Tuesdays and Thursdays for optimal Grade A utilization.
          </Text>
        </View>
      </ScrollView>
    </View>
  );

  const sendChatMessage = () => {
    if (!chatMessage.trim()) return;
    
    const newMessage = {
      id: chatMessages.length + 1,
      text: chatMessage,
      isUser: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    setChatMessages([...chatMessages, newMessage]);
    setChatMessage('');
    
    setTimeout(() => {
      const aiResponse = {
        id: chatMessages.length + 2,
        text: getAIResponse(chatMessage),
        isUser: false,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const getAIResponse = (question) => {
    const lowerQuestion = question.toLowerCase();
    if (lowerQuestion.includes('production') || lowerQuestion.includes('schedule')) {
      return "Based on current forecasts, we recommend scheduling production runs for Mondays and Thursdays when Grade A supply peaks at 58%. Next optimal window: Thursday, 8:00 AM.";
    } else if (lowerQuestion.includes('quality') || lowerQuestion.includes('grade')) {
      return "Current quality distribution: Grade A (58% from Golden Dragon & Spice Junction), Grade B (32% from Bella Italia), Grade C (10% from various vendors). Would you like specific recommendations for Grade C treatment?";
    } else if (lowerQuestion.includes('inventory') || lowerQuestion.includes('stock')) {
      return `Current inventory: ${currentStock.toLocaleString()}L total. Tank A: 82% full (Grade A), Tank B: 45% full (Grade B), Tank C: 94% full (Grade C). Tank C requires attention within 24 hours.`;
    } else if (lowerQuestion.includes('forecast') || lowerQuestion.includes('prediction')) {
      return "7-day forecast: 12,450L (↑8%). 14-day: 25,890L (↑12%). 30-day: 53,200L (↑15%). Grade A expected to reach 56% in 30 days.";
    } else {
      return "I can help with production schedules, quality forecasts, inventory levels, or supplier performance. What specific information do you need?";
    }
  };

  const renderHomeTab = () => (
    <>
      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <LinearGradient
          colors={['#7EE92D', '#5cb85c']}
          style={styles.statCard}
        >
          <DropletsIcon color="#fff" size={24} />
          <Text style={styles.statValue}>{currentStock.toLocaleString()} L</Text>
          <Text style={styles.statLabel}>Current Stock</Text>
          <Text style={styles.statChange}>↑ {stockIncrease}%</Text>
        </LinearGradient>
        
        <LinearGradient
          colors={['#10b981', '#059669']}
          style={styles.statCard}
        >
          <PackageIcon color="#fff" size={24} />
          <Text style={styles.statValue}>{thisWeekVolume.toLocaleString()} L</Text>
          <Text style={styles.statLabel}>This Week</Text>
          <Text style={styles.statChange}>{weeklyDeliveries} deliveries</Text>
        </LinearGradient>
      </View>

      {/* Quality Overview - Click to go to Quality Page */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quality Distribution</Text>
          <TouchableOpacity onPress={() => setSelectedTab('quality')}>
            <Text style={styles.viewAllText}>View Details →</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.qualityCard} onPress={() => setSelectedTab('quality')}>
          <View style={styles.qualityStats}>
            {qualityDistribution.map((item, index) => (
              <View key={index} style={styles.qualityStatItem}>
                <LinearGradient
                  colors={[item.color + '40', item.color + '10']}
                  style={styles.qualityIconGradient}
                >
                  {item.name === 'Grade A' && <TrendingIcon color={item.color} size={24} />}
                  {item.name === 'Grade B' && <AlertTriangleIcon color={item.color} size={24} />}
                  {item.name === 'Grade C' && <AlertTriangleIcon color={item.color} size={24} />}
                </LinearGradient>
                <Text style={styles.qualityPercentage}>{item.value}%</Text>
                <Text style={styles.qualityLabel}>{item.name}</Text>
              </View>
            ))}
          </View>
          
          <PieChart />
        </TouchableOpacity>
      </View>

      {/* AI Supply Forecast - Click to go to Forecasts Page */}
<View style={styles.section}>
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>AI Supply Forecast</Text>
    <TouchableOpacity onPress={() => setSelectedTab('forecasts')}>
      <Text style={styles.viewAllText}>Full Forecast →</Text>
    </TouchableOpacity>
  </View>
  
  <TouchableOpacity style={styles.forecastCardPreview} onPress={() => setSelectedTab('forecasts')}>
    <View style={styles.forecastHeader}>
      <TrendingIcon color="#7EE92D" size={22} />
      <Text style={styles.forecastBadge}>AI Prediction</Text>
    </View>
    <Text style={[styles.forecastTotalValue, { color: '#fff' }]}>{forecastData['7days'].total.toLocaleString()} L</Text>
    <Text style={[styles.forecastTrend, { color: '#7EE92D' }]}>{forecastData['7days'].trend} from current</Text>
    
    <View style={styles.forecastDistribution}>
      <View style={styles.forecastDistItem}>
        <View style={[styles.forecastDistBar, { width: `52%`, backgroundColor: '#7EE92D' }]} />
        <Text style={[styles.forecastDistLabel, { color: '#9ca3af' }]}>Grade A: 52%</Text>
      </View>
      <View style={styles.forecastDistItem}>
        <View style={[styles.forecastDistBar, { width: `34%`, backgroundColor: '#f59e0b' }]} />
        <Text style={[styles.forecastDistLabel, { color: '#9ca3af' }]}>Grade B: 34%</Text>
      </View>
      <View style={styles.forecastDistItem}>
        <View style={[styles.forecastDistBar, { width: `14%`, backgroundColor: '#ef4444' }]} />
        <Text style={[styles.forecastDistLabel, { color: '#9ca3af' }]}>Grade C: 14%</Text>
      </View>
    </View>
  </TouchableOpacity>
</View>

      {/* Weekly Collection Trend */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Weekly Collection</Text>
          <Text style={styles.viewAllText}>Last 7 days</Text>
        </View>
        
        <View style={styles.chartCard}>
          <WeeklyAreaChart />
        </View>
      </View>

      {/* Incoming Deliveries */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Incoming Deliveries</Text>
          <TouchableOpacity onPress={() => setSelectedTab('suppliers')}>
            <Text style={styles.viewAllText}>View All →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.deliveriesList}>
          {upcomingDeliveries.map((delivery) => (
            <TouchableOpacity
              key={delivery.id}
              style={styles.deliveryCard}
            >
              <View style={styles.deliveryContent}>
                <View style={styles.deliveryInfo}>
                  <Text style={styles.restaurantName}>{delivery.restaurant}</Text>
                  <View style={styles.deliveryMeta}>
                    <View style={styles.volumeContainer}>
                      <DropletsIcon color="#6b7280" size={12} />
                      <Text style={styles.volumeText}>{delivery.volume}L</Text>
                    </View>
                    <View style={[styles.qualityTag, { backgroundColor: getQualityBgColor(delivery.quality) }]}>
                      <Text style={[styles.qualityTagText, { color: getQualityColor(delivery.quality) }]}>
                        Grade {delivery.quality}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.deliveryTimeInfo}>
                  <Text style={styles.etaText}>{delivery.eta}</Text>
                  <View style={styles.statusContainer}>
                    <View style={[styles.statusDot, { backgroundColor: delivery.status === 'in-transit' ? '#7EE92D' : '#999' }]} />
                    <Text style={[styles.statusText, { color: delivery.status === 'in-transit' ? '#7EE92D' : '#666' }]}>
                      {delivery.status === 'in-transit' ? 'In Transit' : 'Scheduled'}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </>
  );

  // Area Chart for weekly collection
  const WeeklyAreaChart = () => {
    const maxVolume = Math.max(...weeklyData.map(d => d.volume));
    
    return (
      <View style={styles.areaChartContainer}>
        <View style={styles.areaChart}>
          {weeklyData.map((item, index) => (
            <View key={index} style={styles.areaBarWrapper}>
              <View style={styles.areaBarContainer}>
                <View 
                  style={[
                    styles.areaBar,
                    { 
                      height: (item.volume / maxVolume) * 120,
                      backgroundColor: '#7EE92D',
                    }
                  ]} 
                />
              </View>
              <Text style={styles.areaBarLabel}>{item.day}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderAIChatTab = () => (
    <View style={styles.chatContainer}>
      <LinearGradient
        colors={['#7EE92D', '#5cb85c']}
        style={styles.chatHeader}
      >
        <View style={styles.chatHeaderContent}>
          <ChatIcon color="#fff" size={28} />
          <View>
            <Text style={styles.chatHeaderTitle}>AI Assistant</Text>
            <Text style={styles.chatHeaderSubtitle}>Online • Ready to help</Text>
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={chatMessages}
        keyExtractor={(item) => item.id.toString()}
        style={styles.chatMessagesList}
        contentContainerStyle={styles.chatMessagesContent}
        renderItem={({ item }) => (
          <View style={[styles.chatMessage, item.isUser ? styles.userMessage : styles.aiMessage]}>
            <View style={item.isUser ? styles.userBubble : styles.aiBubble}>
              <Text style={item.isUser ? styles.userMessageText : styles.aiMessageText}>
                {item.text}
              </Text>
              <Text style={styles.messageTime}>{item.time}</Text>
            </View>
          </View>
        )}
      />

      <View style={styles.chatInputContainer}>
        <TextInput
          style={styles.chatInput}
          placeholder="Ask me about production, quality, forecasts..."
          placeholderTextColor="#9ca3af"
          value={chatMessage}
          onChangeText={setChatMessage}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendChatMessage}>
          <LinearGradient colors={['#7EE92D', '#5cb85c']} style={styles.sendGradient}>
            <Text style={styles.sendButtonText}>Send</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.suggestionChips}>
        <TouchableOpacity style={styles.chip} onPress={() => setChatMessage("What's the production schedule?")}>
          <Text style={styles.chipText}>Production schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.chip} onPress={() => setChatMessage("Quality forecast for next week")}>
          <Text style={styles.chipText}>Quality forecast</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.chip} onPress={() => setChatMessage("Current inventory levels")}>
          <Text style={styles.chipText}>Inventory levels</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderESGTab = () => (
    <View style={styles.tabContent}>
      <LinearGradient
        colors={['#10b981', '#059669']}
        style={styles.tabHeaderGradient}
      >
        <Text style={styles.tabHeaderTitle}>Sustainability Report</Text>
        <Text style={styles.tabHeaderSubtitle}>ESG Compliant • Real-time Impact</Text>
      </LinearGradient>
      
      <View style={styles.sustainabilityContainer}>
        <LinearGradient
          colors={['#064e3b', '#065f46']}
          style={styles.impactCard}
        >
          <LeafIcon color="#7EE92D" size={36} />
          <Text style={styles.impactTitle}>Environmental Impact</Text>
          <Text style={styles.impactSubtitle}>Year-to-Date</Text>
        </LinearGradient>

        <View style={styles.statsRow}>
          <View style={styles.impactStatCard}>
            <Text style={styles.impactStatValue}>{sustainabilityData.co2Avoided}</Text>
            <Text style={styles.impactStatLabel}>Tonnes CO₂ Avoided</Text>
            <Text style={styles.impactStatDesc}>↘️ {Math.round(sustainabilityData.co2Avoided * 0.41)} cars off road</Text>
          </View>
          <View style={styles.impactStatCard}>
            <Text style={styles.impactStatValue}>{sustainabilityData.wasteOilDiverted.toLocaleString()}</Text>
            <Text style={styles.impactStatLabel}>Litres Waste Oil</Text>
            <Text style={styles.impactStatDesc}>Diverted from landfills</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.impactStatCard}>
            <Text style={styles.impactStatValue}>{sustainabilityData.fossilDieselDisplaced.toLocaleString()}</Text>
            <Text style={styles.impactStatLabel}>Fossil Diesel Displaced</Text>
            <Text style={styles.impactStatDesc}>100% biodiesel blend</Text>
          </View>
          <View style={styles.impactStatCard}>
            <Text style={styles.impactStatValue}>{sustainabilityData.treesPlantedEquivalent}</Text>
            <Text style={styles.impactStatLabel}>Trees Planted Equivalent</Text>
            <Text style={styles.impactStatDesc}>Carbon offset</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.exportButton}>
          <LinearGradient colors={['#7EE92D', '#5cb85c']} style={styles.exportGradient}>
            <Text style={styles.exportButtonText}>Download Full Report 📄</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAlertsTab = () => (
    <View style={styles.tabContent}>
      <LinearGradient
        colors={['#ef4444', '#dc2626']}
        style={styles.tabHeaderGradient}
      >
        <Text style={styles.tabHeaderTitle}>Alerts</Text>
        <Text style={styles.tabHeaderSubtitle}>3 unread notifications</Text>
      </LinearGradient>
      
      <View style={styles.alertsList}>
        <View style={styles.alertCard}>
          <View style={[styles.alertIcon, { backgroundColor: '#7EE92D20' }]}>
            <AlertTriangleIcon color="#7EE92D" size={22} />
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Low Grade A Stock</Text>
            <Text style={styles.alertMessage}>Grade A below 30% capacity. Schedule collections.</Text>
            <Text style={styles.alertTime}>2 hours ago</Text>
          </View>
        </View>

        <View style={styles.alertCard}>
          <View style={[styles.alertIcon, { backgroundColor: '#f59e0b20' }]}>
            <DropletsIcon color="#f59e0b" size={22} />
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Delivery Incoming</Text>
            <Text style={styles.alertMessage}>Golden Dragon - 450L Grade A arriving in 30 mins</Text>
            <Text style={styles.alertTime}>30 minutes ago</Text>
          </View>
        </View>

        <View style={styles.alertCard}>
          <View style={[styles.alertIcon, { backgroundColor: '#ef444420' }]}>
            <PackageIcon color="#ef4444" size={22} />
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Tank C at 94%</Text>
            <Text style={styles.alertMessage}>Transfer to processing within 24 hours</Text>
            <Text style={styles.alertTime}>Yesterday</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderSuppliersTab = () => (
    <View style={styles.tabContent}>
      <LinearGradient
        colors={['#8b5cf6', '#6d28d9']}
        style={styles.tabHeaderGradient}
      >
        <Text style={styles.tabHeaderTitle}>Supplier Management</Text>
        <Text style={styles.tabHeaderSubtitle}>Active Partners</Text>
      </LinearGradient>
      
      <FlatList
        data={suppliersList}
        keyExtractor={(item, index) => index.toString()}
        style={styles.suppliersList}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.supplierCard}>
            <Image source={{ uri: item.image }} style={styles.supplierImage} />
            <View style={styles.supplierInfo}>
              <View style={styles.supplierHeader}>
                <Text style={styles.supplierName}>{item.name}</Text>
                <View style={[styles.supplierQuality, { backgroundColor: getQualityBgColor(item.quality) }]}>
                  <Text style={[styles.supplierQualityText, { color: getQualityColor(item.quality) }]}>
                    Grade {item.quality}
                  </Text>
                </View>
              </View>
              <Text style={styles.supplierCuisine}>{item.cuisine} • Last: {item.lastDelivery}</Text>
              <View style={styles.supplierStats}>
                <View style={styles.supplierStat}>
                  <Text style={styles.supplierStatValue}>{item.volume.toLocaleString()} L</Text>
                  <Text style={styles.supplierStatLabel}>Total</Text>
                </View>
                <View style={styles.supplierDivider} />
                <View style={styles.supplierStat}>
                  <Text style={styles.supplierStatValue}>{item.reliability}%</Text>
                  <Text style={styles.supplierStatLabel}>Reliability</Text>
                </View>
                <View style={styles.supplierDivider} />
                <View style={styles.supplierStat}>
                  <Text style={styles.supplierStatValue}>{item.deliveries}</Text>
                  <Text style={styles.supplierStatLabel}>Deliveries</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );

  // Main Header Component with Logo
  const MainHeader = () => (
    <LinearGradient
      colors={['#10b981', '#059669']}
      style={styles.header}
    >
      <View style={styles.headerContent}>
        <View style={styles.headerTop}>
          <View style={styles.logoContainer}>
            <BioLoopLogo size={45} />
            <View>
              <Text style={styles.appName}>BioLoop</Text>
              <Text style={styles.companyName}>GreenFuel Manufacturing</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Text style={styles.profileInitial}>GF</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {selectedTab === 'home' && <MainHeader />}
        
        <View style={[styles.content, selectedTab !== 'home' && styles.contentNoHeader]}>
          {selectedTab === 'home' && renderHomeTab()}
          {selectedTab === 'quality' && renderQualityDistributionPage()}
          {selectedTab === 'forecasts' && renderForecastsPage()}
          {selectedTab === 'ai-chat' && renderAIChatTab()}
          {selectedTab === 'esg' && renderESGTab()}
          {selectedTab === 'alerts' && renderAlertsTab()}
          {selectedTab === 'suppliers' && renderSuppliersTab()}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => setSelectedTab('home')}>
          <View style={[styles.navIconContainer, selectedTab === 'home' && styles.activeNavIcon]}>
            <HomeIcon color={selectedTab === 'home' ? '#10b981' : '#6b7280'} size={22} />
          </View>
          <Text style={[styles.navLabel, selectedTab === 'home' && styles.activeNavLabel]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setSelectedTab('quality')}>
          <View style={[styles.navIconContainer, selectedTab === 'quality' && styles.activeNavIcon]}>
            <ChartIcon color={selectedTab === 'quality' ? '#10b981' : '#6b7280'} size={22} />
          </View>
          <Text style={[styles.navLabel, selectedTab === 'quality' && styles.activeNavLabel]}>Quality</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setSelectedTab('ai-chat')}>
          <View style={[styles.navIconContainer, selectedTab === 'ai-chat' && styles.activeNavIcon]}>
            <ChatIcon color={selectedTab === 'ai-chat' ? '#10b981' : '#6b7280'} size={22} />
          </View>
          <Text style={[styles.navLabel, selectedTab === 'ai-chat' && styles.activeNavLabel]}>AI Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setSelectedTab('esg')}>
          <View style={[styles.navIconContainer, selectedTab === 'esg' && styles.activeNavIcon]}>
            <LeafIcon color={selectedTab === 'esg' ? '#10b981' : '#6b7280'} size={22} />
          </View>
          <Text style={[styles.navLabel, selectedTab === 'esg' && styles.activeNavLabel]}>ESG</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setSelectedTab('suppliers')}>
          <View style={[styles.navIconContainer, selectedTab === 'suppliers' && styles.activeNavIcon]}>
            <UsersIcon color={selectedTab === 'suppliers' ? '#10b981' : '#6b7280'} size={22} />
          </View>
          <Text style={[styles.navLabel, selectedTab === 'suppliers' && styles.activeNavLabel]}>Suppliers</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setSelectedTab('alerts')}>
          <View style={[styles.navIconContainer, selectedTab === 'alerts' && styles.activeNavIcon]}>
            <BellIcon color={selectedTab === 'alerts' ? '#10b981' : '#6b7280'} size={22} />
          </View>
          <Text style={[styles.navLabel, selectedTab === 'alerts' && styles.activeNavLabel]}>Alerts</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  companyName: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.9,
    marginTop: 2,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10b981',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginTop: 12,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 4,
  },
  statChange: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
  },
  content: {
    flex: 1,
    paddingBottom: 80,
  },
  contentNoHeader: {
    paddingTop: 20,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  viewAllText: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '500',
  },
  qualityCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  qualityStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  qualityStatItem: {
    alignItems: 'center',
  },
  qualityIconGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  qualityPercentage: {
    fontSize: 22,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  qualityLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  pieContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  pieWrapper: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pieRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
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
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    top: 30,
    left: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pieCenterText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  pieCenterSubtext: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
forecastCardPreview: {
  backgroundColor: '#1a1a2e', 
  borderRadius: 16,
  padding: 20,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 4,
  elevation: 2,
},
  forecastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  forecastBadge: {
    fontSize: 12,
    color: '#7EE92D',
    backgroundColor: '#7EE92D20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  forecastTotalValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  forecastTrend: {
    fontSize: 13,
    color: '#7EE92D',
    marginBottom: 20,
  },
  forecastDistribution: {
    gap: 12,
    marginTop: 8,
  },
  forecastDistItem: {
    gap: 4,
  },
  forecastDistBar: {
    height: 6,
    borderRadius: 3,
  },
  forecastDistLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  areaChartContainer: {
    marginTop: 8,
  },
  areaChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
  },
  areaBarWrapper: {
    alignItems: 'center',
    width: 40,
  },
  areaBarContainer: {
    height: 130,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  areaBar: {
    width: 32,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  areaBarLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  deliveriesList: {
    gap: 12,
  },
  deliveryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  deliveryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deliveryInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 6,
  },
  deliveryMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  volumeText: {
    fontSize: 12,
    color: '#6b7280',
  },
  qualityTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  qualityTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  deliveryTimeInfo: {
    alignItems: 'flex-end',
  },
  etaText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    alignItems: 'center',
    gap: 4,
  },
  navIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeNavIcon: {
    backgroundColor: '#10b98120',
  },
  navLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  activeNavLabel: {
    color: '#10b981',
    fontWeight: '500',
  },
  tabContent: {
    flex: 1,
  },
  tabHeaderGradient: {
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tabHeaderTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  tabHeaderSubtitle: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.9,
  },
  // Quality Distribution Page Styles
  pieOverviewCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  pieOverviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  gradeSection: {
    marginHorizontal: 16,
    marginBottom: 20,
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
  gradeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  gradeTotal: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
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
    height: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    marginBottom: 6,
    overflow: 'hidden',
  },
  sourceBar: {
    height: '100%',
    borderRadius: 3,
  },
  sourcePercentage: {
    fontSize: 11,
    color: '#9ca3af',
  },
  // Forecasts Page Styles
  forecastsContainer: {
    paddingHorizontal: 16,
  },
  forecastPeriodContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  forecastPeriodBtnLarge: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activeForecastPeriodLarge: {
    backgroundColor: '#f59e0b',
  },
  forecastPeriodTextLarge: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  activeForecastPeriodTextLarge: {
    color: '#fff',
  },
  forecastPeriodValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  forecastPeriodTrend: {
    fontSize: 11,
    color: '#ffffff',
    marginTop: 4,
  },
  forecastDetailCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  forecastDistributionLarge: {
    marginTop: 20,
    gap: 16,
  },
  forecastDistTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  forecastDistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  forecastDistPercent: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  forecastDistBarLarge: {
    height: 8,
    borderRadius: 4,
  },
  forecastInsight: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#ffffff10',
    borderRadius: 12,
  },
  forecastInsightText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  recommendationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#7EE92D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  recommendationText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  // Sustainability Page Styles
  sustainabilityContainer: {
    paddingHorizontal: 16,
    gap: 16,
    paddingBottom: 20,
  },
  impactCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  impactTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    marginTop: 12,
  },
  impactSubtitle: {
    fontSize: 13,
    color: '#7EE92D',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  impactStatCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  impactStatValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 4,
  },
  impactStatLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  impactStatDesc: {
    fontSize: 10,
    color: '#6b7280',
  },
  exportButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  exportGradient: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: 'center',
  },
  exportButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  // Alerts Page Styles
  alertsList: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 20,
  },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  alertIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 6,
  },
  alertTime: {
    fontSize: 11,
    color: '#9ca3af',
  },
  // Suppliers Page Styles
  suppliersList: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  supplierCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  supplierImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
  },
  supplierInfo: {
    flex: 1,
  },
  supplierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  supplierName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  supplierQuality: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  supplierQualityText: {
    fontSize: 11,
    fontWeight: '500',
  },
  supplierCuisine: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  supplierStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  supplierStat: {
    alignItems: 'center',
    flex: 1,
  },
  supplierStatValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  supplierStatLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  supplierDivider: {
    width: 1,
    backgroundColor: '#f3f4f6',
  },
  // AI Chat Styles
  chatContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  chatHeader: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  chatHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chatHeaderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  chatHeaderSubtitle: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  chatMessagesList: {
    flex: 1,
    height: 400,
  },
  chatMessagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  chatMessage: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  userBubble: {
    backgroundColor: '#10b981',
    borderRadius: 20,
    borderTopRightRadius: 4,
    padding: 12,
    maxWidth: '80%',
  },
  aiBubble: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderTopLeftRadius: 4,
    padding: 12,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userMessageText: {
    fontSize: 15,
    color: '#fff',
  },
  aiMessageText: {
    fontSize: 15,
    color: '#111827',
  },
  messageTime: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 4,
  },
  chatInputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'flex-end',
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 80,
    color: '#111827',
  },
  sendButton: {
    marginLeft: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  sendGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  suggestionChips: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  chip: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chipText: {
    fontSize: 12,
    color: '#6b7280',
  },
});

export default ManufacturerDashboard;