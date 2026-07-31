// screens/manufacturer/SuppliersScreen.js
import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  StatusBar,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';
import { useManufacturerContext } from '../../src/contexts/ManufacturerContext';
import { computeSupplierStats } from '../../src/utils/manufacturerAnalytics';

const { width } = Dimensions.get('window');

const SuppliersScreen = ({ navigation, onBack }) => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    location: '',
    contact: '',
    email: '',
    cuisine: '',
  });
  const { pickups = [] } = useManufacturerContext();
  
  // State to store manually added suppliers
  const [manualSuppliers, setManualSuppliers] = useState([]);

  // One card per restaurant, aggregated from real pickups
  const suppliersFromData = useMemo(() => computeSupplierStats(pickups), [pickups]);

  // Combine data suppliers with manually added suppliers
  const allSuppliers = useMemo(() => {
    // Give manual suppliers a default structure if they don't have all fields
    const formattedManual = manualSuppliers.map(s => ({
      id: s.id || `manual_${Date.now()}_${Math.random()}`,
      name: s.name,
      location: s.location || 'Unknown',
      contact: s.contact || 'Not provided',
      email: s.email || 'Not provided',
      cuisine: s.cuisine || 'General',
      image: 'https://via.placeholder.com/70',
      quality: s.quality || 'B',
      volume: s.volume || 0,
      reliability: s.reliability || 0,
      deliveries: s.deliveries || 0,
      lastDelivery: s.lastDelivery || 'N/A',
      isManual: true, // Flag to identify manually added suppliers
    }));
    
    return [...suppliersFromData, ...formattedManual];
  }, [suppliersFromData, manualSuppliers]);

  // Filter based on search or category
  const filteredSuppliers = allSuppliers.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || s.quality === selectedFilter;
    return matchesSearch && matchesFilter;
  });

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

  // Handle adding a new supplier
  const handleAddSupplier = useCallback(() => {
    if (!newSupplier.name.trim()) {
      Alert.alert('Error', 'Please enter a supplier name');
      return;
    }
    if (!newSupplier.location.trim()) {
      Alert.alert('Error', 'Please enter a location');
      return;
    }

    // Create new supplier object
    const supplier = {
      id: `manual_${Date.now()}`,
      name: newSupplier.name.trim(),
      location: newSupplier.location.trim(),
      contact: newSupplier.contact.trim() || 'Not provided',
      email: newSupplier.email.trim() || 'Not provided',
      cuisine: newSupplier.cuisine.trim() || 'General',
      image: 'https://via.placeholder.com/70',
      quality: 'B', // Default quality
      volume: 0,
      reliability: 0,
      deliveries: 0,
      lastDelivery: 'N/A',
      isManual: true,
    };

    // Add to manual suppliers list
    setManualSuppliers(prev => [...prev, supplier]);

    Alert.alert(
      'Success',
      `${supplier.name} has been added as a supplier!`,
      [
        {
          text: 'OK',
          onPress: () => {
            setAddModalVisible(false);
            setNewSupplier({
              name: '',
              location: '',
              contact: '',
              email: '',
              cuisine: '',
            });
          }
        }
      ]
    );
  }, [newSupplier]);

  const handleInputChange = useCallback((field, value) => {
    setNewSupplier(prev => ({ ...prev, [field]: value }));
  }, []);

  // Icons
  const StarIcon = ({ color = '#f59e0b', size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2L15 9H22L16 14L19 21L12 16.5L5 21L8 14L2 9H9L12 2Z" stroke={color} strokeWidth={1.5} fill={color} fillOpacity="0.3"/>
    </Svg>
  );

  const TruckIcon = ({ color = '#fff', size = 20 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="16" height="12" rx="1" stroke={color} strokeWidth={1.6}/>
      <Circle cx="6" cy="18" r="2" stroke={color} strokeWidth={1.6}/>
      <Circle cx="18" cy="18" r="2" stroke={color} strokeWidth={1.6}/>
      <Path d="M18 8H20L22 10V16H18" stroke={color} strokeWidth={1.6} strokeLinecap="round"/>
    </Svg>
  );

  const PhoneIcon = ({ color = '#fff', size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );

  const MailIcon = ({ color = '#fff', size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="4" width="20" height="16" rx="2" stroke={color} strokeWidth={1.6}/>
      <Path d="M22 7L12 13L2 7" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );

  const MapPinIcon = ({ color = '#fff', size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke={color} strokeWidth={1.6}/>
      <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth={1.6}/>
    </Svg>
  );

  const TrendingUpIcon = ({ color = '#fff', size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="18,15 22,11 18,7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      <Polyline points="2,17 8,11 12,15 18,9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );

  // Header Component
  const Header = () => (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#7c3aed" />
      <LinearGradient
        colors={['#8b5cf6', '#7c3aed', '#6d28d9']}
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
            <Text style={styles.headerTitle}>Supplier Management</Text>
            <Text style={styles.headerSubtitle}>Active Partners</Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setAddModalVisible(true)}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </>
  );

  // Add Supplier Modal
  const AddSupplierModal = useMemo(() => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={addModalVisible}
      onRequestClose={() => setAddModalVisible(false)}
    >
      <KeyboardAvoidingView 
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Supplier</Text>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setAddModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.addForm}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Supplier Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter supplier name"
                  placeholderTextColor="#9ca3af"
                  value={newSupplier.name}
                  onChangeText={(text) => handleInputChange('name', text)}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Location *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter location"
                  placeholderTextColor="#9ca3af"
                  value={newSupplier.location}
                  onChangeText={(text) => handleInputChange('location', text)}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Contact Person</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter contact name"
                  placeholderTextColor="#9ca3af"
                  value={newSupplier.contact}
                  onChangeText={(text) => handleInputChange('contact', text)}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter email address"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  value={newSupplier.email}
                  onChangeText={(text) => handleInputChange('email', text)}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Cuisine Type</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter cuisine type"
                  placeholderTextColor="#9ca3af"
                  value={newSupplier.cuisine}
                  onChangeText={(text) => handleInputChange('cuisine', text)}
                />
              </View>

              <TouchableOpacity 
                style={styles.submitButton}
                onPress={handleAddSupplier}
              >
                <LinearGradient
                  colors={['#8b5cf6', '#7c3aed']}
                  style={styles.submitGradient}
                >
                  <Text style={styles.submitButtonText}>Add Supplier</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  ), [addModalVisible, newSupplier, handleInputChange, handleAddSupplier]);

  // Supplier Detail Modal
  const SupplierDetailModal = useMemo(() => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {selectedSupplier && (
              <>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
                
                <View style={styles.modalHeader}>
                  <Image source={{ uri: selectedSupplier.image }} style={styles.modalImage} />
                  <View style={styles.modalHeaderInfo}>
                    <Text style={styles.modalName}>{selectedSupplier.name}</Text>
                    <View style={[styles.modalQualityTag, { backgroundColor: getQualityBgColor(selectedSupplier.quality) }]}>
                      <Text style={[styles.modalQualityText, { color: getQualityColor(selectedSupplier.quality) }]}>
                        Grade {selectedSupplier.quality}
                      </Text>
                    </View>
                    {selectedSupplier.isManual && (
                      <View style={styles.manualTag}>
                        <Text style={styles.manualTagText}>Manually Added</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.modalStats}>
                  <View style={styles.modalStat}>
                    <Text style={styles.modalStatValue}>{selectedSupplier.volume.toLocaleString()} L</Text>
                    <Text style={styles.modalStatLabel}>Total Volume</Text>
                  </View>
                  <View style={styles.modalStatDivider} />
                  <View style={styles.modalStat}>
                    <Text style={styles.modalStatValue}>{selectedSupplier.reliability}%</Text>
                    <Text style={styles.modalStatLabel}>Reliability</Text>
                  </View>
                  <View style={styles.modalStatDivider} />
                  <View style={styles.modalStat}>
                    <Text style={styles.modalStatValue}>{selectedSupplier.deliveries}</Text>
                    <Text style={styles.modalStatLabel}>Deliveries</Text>
                  </View>
                </View>

                <View style={styles.modalInfo}>
                  <View style={styles.modalInfoRow}>
                    <MapPinIcon color="#6b7280" size={16} />
                    <Text style={styles.modalInfoText}>{selectedSupplier.location}</Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <TruckIcon color="#6b7280" size={16} />
                    <Text style={styles.modalInfoText}>Last delivery: {selectedSupplier.lastDelivery}</Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <PhoneIcon color="#6b7280" size={16} />
                    <Text style={styles.modalInfoText}>{selectedSupplier.contact}</Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <MailIcon color="#6b7280" size={16} />
                    <Text style={styles.modalInfoText}>{selectedSupplier.email}</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.contactButton}>
                  <LinearGradient
                    colors={['#8b5cf6', '#7c3aed']}
                    style={styles.contactGradient}
                  >
                    <Text style={styles.contactButtonText}>Contact Supplier</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  ), [modalVisible, selectedSupplier]);

  return (
    <View style={styles.container}>
      <Header />
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search suppliers..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Filter Chips */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filtersContainer}
        >
          <TouchableOpacity 
            style={[styles.filterChip, selectedFilter === 'all' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text style={[styles.filterText, selectedFilter === 'all' && styles.filterTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterChip, selectedFilter === 'A' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('A')}
          >
            <Text style={[styles.filterText, selectedFilter === 'A' && styles.filterTextActive]}>Grade A</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterChip, selectedFilter === 'B' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('B')}
          >
            <Text style={[styles.filterText, selectedFilter === 'B' && styles.filterTextActive]}>Grade B</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterChip, selectedFilter === 'C' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('C')}
          >
            <Text style={[styles.filterText, selectedFilter === 'C' && styles.filterTextActive]}>Grade C</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Supplier List */}
        <View style={styles.suppliersList}>
          {filteredSuppliers.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No suppliers found</Text>
              <Text style={styles.emptyStateSubtext}>Tap the + button to add a new supplier</Text>
            </View>
          ) : (
            filteredSuppliers.map((supplier) => (
              <TouchableOpacity
                key={supplier.id}
                style={styles.supplierCard}
                onPress={() => {
                  setSelectedSupplier(supplier);
                  setModalVisible(true);
                }}
                activeOpacity={0.7}
              >
                <Image source={{ uri: supplier.image }} style={styles.supplierImage} />
                <View style={styles.supplierInfo}>
                  <View style={styles.supplierHeader}>
                    <View style={styles.supplierNameContainer}>
                      <Text style={styles.supplierName}>{supplier.name}</Text>
                      {supplier.isManual && (
                        <View style={styles.manualBadge}>
                          <Text style={styles.manualBadgeText}>New</Text>
                        </View>
                      )}
                      <View style={styles.reliabilityBadge}>
                        <StarIcon color="#f59e0b" size={12} />
                        <Text style={styles.reliabilityText}>{supplier.reliability}%</Text>
                      </View>
                    </View>
                    <View style={[styles.supplierQuality, { backgroundColor: getQualityBgColor(supplier.quality) }]}>
                      <Text style={[styles.supplierQualityText, { color: getQualityColor(supplier.quality) }]}>
                        Grade {supplier.quality}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.supplierCuisine}>{supplier.cuisine} • {supplier.location}</Text>
                  
                  <View style={styles.supplierStats}>
                    <View style={styles.supplierStat}>
                      <Text style={styles.supplierStatValue}>{supplier.volume.toLocaleString()} L</Text>
                      <Text style={styles.supplierStatLabel}>Total</Text>
                    </View>
                    <View style={styles.supplierDivider} />
                    <View style={styles.supplierStat}>
                      <View style={styles.trendContainer}>
                        <Text style={styles.supplierStatValue}>{supplier.deliveries}</Text>
                        <TrendingUpIcon color="#7EE92D" size={12} />
                      </View>
                      <Text style={styles.supplierStatLabel}>Deliveries</Text>
                    </View>
                    <View style={styles.supplierDivider} />
                    <View style={styles.supplierStat}>
                      <Text style={styles.supplierLastDelivery}>{supplier.lastDelivery}</Text>
                      <Text style={styles.supplierStatLabel}>Last Delivery</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Summary Card */}
        <LinearGradient
          colors={['#8b5cf6', '#7c3aed']}
          style={styles.summaryCard}
        >
          <Text style={styles.summaryTitle}>Supplier Summary</Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatValue}>{allSuppliers.length}</Text>
              <Text style={styles.summaryStatLabel}>Active Suppliers</Text>
            </View>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatValue}>
                {allSuppliers.reduce((sum, s) => sum + s.volume, 0).toLocaleString()} L
              </Text>
              <Text style={styles.summaryStatLabel}>Total Volume</Text>
            </View>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatValue}>
                {allSuppliers.length > 0 ? Math.round(allSuppliers.reduce((sum, s) => sum + s.reliability, 0) / allSuppliers.length) : 0}%
              </Text>
              <Text style={styles.summaryStatLabel}>Avg Reliability</Text>
            </View>
          </View>
        </LinearGradient>
        
        {/* Bottom padding for better scrolling */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {SupplierDetailModal}
      {AddSupplierModal}
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  filtersScroll: {
    marginTop: 8,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterChipActive: {
    backgroundColor: '#8b5cf6',
  },
  filterText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  suppliersList: {
    paddingHorizontal: 16,
    marginTop: 16,
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
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  supplierNameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  supplierName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  manualBadge: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  manualBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#fff',
  },
  reliabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  reliabilityText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#f59e0b',
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
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  supplierLastDelivery: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  supplierDivider: {
    width: 1,
    backgroundColor: '#f3f4f6',
  },
  summaryCard: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 10,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  summaryStatLabel: {
    fontSize: 11,
    color: '#fff',
    opacity: 0.9,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    padding: 20,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  modalImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  modalHeaderInfo: {
    flex: 1,
  },
  modalName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  modalQualityTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modalQualityText: {
    fontSize: 13,
    fontWeight: '500',
  },
  manualTag: {
    marginTop: 4,
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  manualTagText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500',
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
    marginBottom: 16,
  },
  modalStat: {
    alignItems: 'center',
    flex: 1,
  },
  modalStatDivider: {
    width: 1,
    backgroundColor: '#f3f4f6',
  },
  modalStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8b5cf6',
    marginBottom: 4,
  },
  modalStatLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  modalInfo: {
    gap: 12,
    marginBottom: 20,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalInfoText: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  contactButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  contactGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Add Supplier Modal Styles
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  addForm: {
    marginTop: 10,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 20,
  },
  submitGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  bottomPadding: {
    height: 30,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 8,
  },
});

export default SuppliersScreen;