import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';
import { useAuth } from '../../AuthContext';
import { useManufacturerContext } from '../../src/contexts/ManufacturerContext';
import { useProfile } from '../../src/hooks/useProfile';
import { getInitials } from '../../src/utils/restaurantViewModels';

// Import all screens - FIXED PATHS
import QualityScreen from './QualityScreen';
import ForecastsScreen from './ForecastsScreen';
import AIChatScreen from './AIChatScreen';
import SuppliersScreen from './SuppliersScreen';
import AlertsScreen from './AlertsScreen';
import ProfileScreen from './ProfileScreen';

const { width } = Dimensions.get('window');

const ManufacturerDashboardScreen = ({ navigation }) => {
  const { signOut } = useAuth();
  const { manufacturer, inventory, tanks, forecasts, pickups, alerts, loading, refreshManufacturer } = useManufacturerContext();
  const { profile } = useProfile();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('home');

  const profileInitials = useMemo(
    () => getInitials(profile?.full_name ?? manufacturer?.contact_person ?? manufacturer?.name, 'MF'),
    [profile, manufacturer]
  );

  // derive values from bundle with sensible fallbacks
  const currentStock = inventory?.current_stock_liters ?? 0;
  const stockIncrease = inventory?.stock_change_pct ?? 0;
  const thisWeekVolume = forecasts?.[0]?.total_volume_liters ?? 0;
  const weeklyDeliveries = (pickups || []).length;

  const weeklyData = (() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const totals = days.reduce((acc, day) => ({ ...acc, [day]: 0 }), {});

    (pickups || []).forEach((p) => {
      if (!p.pickup_date) return;
      const date = new Date(p.pickup_date);
      if (Number.isNaN(date.getTime())) return;
      const day = date.toLocaleDateString('en-US', { weekday: 'short' });
      if (totals[day] !== undefined) {
        totals[day] += p.estimated_volume_liters ?? p.actual_volume_liters ?? 0;
      }
    });

    return days.map((day) => ({ day, volume: totals[day] }));
  })();

  // Use real forecasts data or empty placeholder
  const sevenDayForecast = forecasts?.find(f => f.period_days === 7) || null;
  const qualityDistribution = sevenDayForecast ? [
    { name: 'Grade A', value: sevenDayForecast.grade_a_pct ?? 0, color: '#7EE92D' },
    { name: 'Grade B', value: sevenDayForecast.grade_b_pct ?? 0, color: '#f59e0b' },
    { name: 'Grade C', value: sevenDayForecast.grade_c_pct ?? 0, color: '#ef4444' },
  ] : [];

  // Use real pickups or empty placeholder
  const upcomingDeliveries = (pickups || []).slice(0, 3).map(p => ({
    id: p.id,
    restaurant: p.restaurants?.name ?? 'Unknown',
    volume: p.estimated_volume_liters ?? p.actual_volume_liters ?? 0,
    quality: p.quality_grade ?? '—',
    eta: p.pickup_time_start ?? '—',
    status: p.status ?? 'scheduled',
  }));

  const onRefresh = () => {
    if (refreshManufacturer) {
      refreshManufacturer();
    }
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  // Forecast data from real context or placeholders
  const forecastData = sevenDayForecast ? {
    '7days': {
      total: sevenDayForecast.total_volume_liters ?? 0,
      gradeA: sevenDayForecast.grade_a_pct ?? 0,
      gradeB: sevenDayForecast.grade_b_pct ?? 0,
      gradeC: sevenDayForecast.grade_c_pct ?? 0,
      trend: sevenDayForecast.trend_label ?? '—',
      confidence: sevenDayForecast.confidence_pct ?? 0,
    }
  } : { '7days': { total: 0, gradeA: 0, gradeB: 0, gradeC: 0, trend: '—', confidence: 0 } };

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

  // Icons for Bottom Navigation
  const HomeIcon = ({ color = '#fff', size = 22 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" stroke={color} strokeWidth={1.6} strokeLinejoin="round"/>
      <Path d="M9 21V12h6v9" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );

  const ForecastIcon = ({ color = '#fff', size = 22 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="4" width="20" height="16" rx="2" stroke={color} strokeWidth={1.6}/>
      <Path d="M7 15L9 12L12 14L16 9L18 11" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M2 8H22" stroke={color} strokeWidth={1.6} strokeLinecap="round"/>
      <Circle cx="7" cy="15" r="1.5" fill={color} stroke="none"/>
      <Circle cx="12" cy="14" r="1.5" fill={color} stroke="none"/>
      <Circle cx="18" cy="11" r="1.5" fill={color} stroke="none"/>
    </Svg>
  );

  const AIChatIcon = ({ color = '#fff', size = 22 }) => (
    <View style={styles.aiIconContainer}>
      <Image 
        source={require('../../assets/BioLoop_Logo.png')} 
        style={[styles.aiIconImage, { width: size, height: size }]}
        resizeMode="cover"
      />
    </View>
  );

  const SuppliersIcon = ({ color = '#fff', size = 22 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="8" cy="7" r="3" stroke={color} strokeWidth={1.6}/>
      <Circle cx="16" cy="7" r="3" stroke={color} strokeWidth={1.6}/>
      <Path d="M3 18v-2a4 4 0 014-4h2a4 4 0 014 4v2" stroke={color} strokeWidth={1.6} strokeLinecap="round"/>
      <Path d="M15 18v-2a4 4 0 014-4h2a4 4 0 014 4v2" stroke={color} strokeWidth={1.6} strokeLinecap="round"/>
    </Svg>
  );

  const AlertsIcon = ({ color = '#fff', size = 22 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M13.73 21a2 2 0 01-3.46 0" stroke={color} strokeWidth={1.6} strokeLinecap="round"/>
    </Svg>
  );

  const ProfileIcon = ({ color = '#fff', size = 22 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={1.6}/>
      <Path d="M5 20v-2a7 7 0 0114 0v2" stroke={color} strokeWidth={1.6} strokeLinecap="round"/>
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

  const TrendingIcon = ({ color = '#fff', size = 22 }) => (
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

  // Pie Chart Component
  const PieChart = () => {
    const segments = qualityDistribution.map((item) => ({
      percentage: item.value,
      color: item.color,
      label: item.name,
    }));
    
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

  // Area Chart for weekly collection
  const WeeklyAreaChart = () => {
    const maxVolume = Math.max(...weeklyData.map(d => d.volume), 1);
    
    return (
      <View style={styles.areaChartContainer}>
        <View style={styles.areaChart}>
          {weeklyData.map((item, index) => {
            const height = maxVolume > 0 ? (item.volume / maxVolume) * 120 : 0;
            return (
              <View key={index} style={styles.areaBarWrapper}>
                <View style={styles.areaBarContainer}>
                  <View 
                    style={[
                      styles.areaBar,
                      { 
                        height,
                        backgroundColor: '#7EE92D',
                      }
                    ]} 
                  />
              </View>
              <Text style={styles.areaBarLabel}>{item.day}</Text>
            </View>
         );
        })}
        </View>
      </View>
    );
  };

  // Header Component
  const MainHeader = () => (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['#ffffff', '#10b981', '#059669', '#047857']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Image 
                  source={require('../../assets/BioLoop_Logo.png')} 
                  style={styles.logoImage}
                  resizeMode="cover"
                />
              </View>
              <View>
                <Text style={styles.appName}>BioLoop</Text>
                <Text style={styles.companyName}>GreenFuel Manufacturing</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.headerSignOutButton} onPress={signOut}>
              <Text style={styles.headerSignOutText}>Logout</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileButton}>
              <Text style={styles.profileInitial}>{profileInitials}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </>
  );

  // Render different content based on selected tab
  const renderContent = () => {
    switch(selectedTab) {
      case 'home':
        return (
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

            {/* Quality Overview */}
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

            {/* AI Supply Forecast */}
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
                    <View style={[styles.forecastDistBar, { width: `${forecastData['7days'].gradeA}%`, backgroundColor: '#7EE92D' }]} />
                    <Text style={[styles.forecastDistLabel, { color: '#9ca3af' }]}>Grade A: {forecastData['7days'].gradeA}%</Text>
                  </View>
                  <View style={styles.forecastDistItem}>
                    <View style={[styles.forecastDistBar, { width: `${forecastData['7days'].gradeB}%`, backgroundColor: '#f59e0b' }]} />
                    <Text style={[styles.forecastDistLabel, { color: '#9ca3af' }]}>Grade B: {forecastData['7days'].gradeB}%</Text>
                  </View>
                  <View style={styles.forecastDistItem}>
                    <View style={[styles.forecastDistBar, { width: `${forecastData['7days'].gradeC}%`, backgroundColor: '#ef4444' }]} />
                    <Text style={[styles.forecastDistLabel, { color: '#9ca3af' }]}>Grade C: {forecastData['7days'].gradeC}%</Text>
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
                    onPress={() => setSelectedTab('suppliers')}
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
                          <View style={[styles.statusDot, { backgroundColor: delivery.status === 'in_transit' ? '#7EE92D' : '#999' }]} />
                          <Text style={[styles.statusText, { color: delivery.status === 'in_transit' ? '#7EE92D' : '#666' }]}>
                            {delivery.status === 'in_transit' ? 'In Transit' : 'Scheduled'}
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
      case 'quality':
        return <QualityScreen navigation={navigation} />;
      case 'forecasts':
        return <ForecastsScreen navigation={navigation} />;
      case 'ai-chat':
        return <AIChatScreen navigation={navigation} />;
      case 'suppliers':
        return <SuppliersScreen navigation={navigation} />;
      case 'alerts':
        return <AlertsScreen navigation={navigation} />;
      case 'profile':
        return <ProfileScreen navigation={navigation} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <MainHeader />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.content}>
          {renderContent()}
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

        <TouchableOpacity style={styles.navItem} onPress={() => setSelectedTab('forecasts')}>
          <View style={[styles.navIconContainer, selectedTab === 'forecasts' && styles.activeNavIcon]}>
            <ForecastIcon color={selectedTab === 'forecasts' ? '#10b981' : '#6b7280'} size={22} />
          </View>
          <Text style={[styles.navLabel, selectedTab === 'forecasts' && styles.activeNavLabel]}>Forecasts</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setSelectedTab('ai-chat')}>
          <View style={[styles.navIconContainer, selectedTab === 'ai-chat' && styles.activeNavIcon]}>
            <AIChatIcon color={selectedTab === 'ai-chat' ? '#10b981' : '#6b7280'} size={22} />
          </View>
          <Text style={[styles.navLabel, selectedTab === 'ai-chat' && styles.activeNavLabel]}>AI Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setSelectedTab('suppliers')}>
          <View style={[styles.navIconContainer, selectedTab === 'suppliers' && styles.activeNavIcon]}>
            <SuppliersIcon color={selectedTab === 'suppliers' ? '#10b981' : '#6b7280'} size={22} />
          </View>
          <Text style={[styles.navLabel, selectedTab === 'suppliers' && styles.activeNavLabel]}>Suppliers</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setSelectedTab('alerts')}>
          <View style={[styles.navIconContainer, selectedTab === 'alerts' && styles.activeNavIcon]}>
            <AlertsIcon color={selectedTab === 'alerts' ? '#10b981' : '#6b7280'} size={22} />
          </View>
          <Text style={[styles.navLabel, selectedTab === 'alerts' && styles.activeNavLabel]}>Alerts</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setSelectedTab('profile')}>
          <View style={[styles.navIconContainer, selectedTab === 'profile' && styles.activeNavIcon]}>
            <ProfileIcon color={selectedTab === 'profile' ? '#10b981' : '#6b7280'} size={22} />
          </View>
          <Text style={[styles.navLabel, selectedTab === 'profile' && styles.activeNavLabel]}>Profile</Text>
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
    paddingTop: 60,
    paddingBottom: 12,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  logoCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  logoImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  companyName: {
    fontSize: 11,
    color: '#fff',
    opacity: 0.9,
    marginTop: 2,
  },
  headerSignOutButton: {
    backgroundColor: 'rgba(220,38,38,0.85)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    marginHorizontal: 10,
  },
  headerSignOutText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  profileInitial: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10b981',
  },
  aiIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  aiIconImage: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  content: {
    flex: 1,
    paddingBottom: 80,
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
    marginBottom: 4,
  },
  forecastTrend: {
    fontSize: 13,
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
});

export default ManufacturerDashboardScreen;
