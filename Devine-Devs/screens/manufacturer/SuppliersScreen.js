// screens/manufacturer/SuppliersScreen.js
import React, { useMemo, useState } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useManufacturerContext } from '../../src/contexts/ManufacturerContext';
import { computeSupplierStats } from '../../src/utils/manufacturerAnalytics';
import { ACTIVE_TRIP_STATUSES, PICKUP_STATUS_LABELS } from '../../src/lib/pickupStatus';

const { width } = Dimensions.get('window');

// ─── THEME (matches Dashboard / Quality / Finance) ───────────────────────────

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

  danger: '#ef4444',
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
  header: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  button: {
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
};

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

const SuppliersScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const { pickups = [], assignedRestaurants = [] } = useManufacturerContext();
  const insets = useSafeAreaInsets();

  const activeDeliveryByRestaurantId = useMemo(() => {
    const map = new Map();
    (pickups || []).forEach((p) => {
      if (!ACTIVE_TRIP_STATUSES.includes(p.status)) return;
      map.set(p.restaurant_id, {
        pickupId: p.id,
        status: p.status,
        statusLabel: PICKUP_STATUS_LABELS[p.status] ?? p.status,
        driverName: p.collectors?.full_name ?? 'A driver',
      });
    });
    return map;
  }, [pickups]);

  const handleConfirmDelivery = (pickupId) => {
    setModalVisible(false);
    navigation.navigate('ManufacturerPayment', { pickupId });
  };

  const statsByRestaurantId = useMemo(() => {
    const map = new Map();
    computeSupplierStats(pickups).forEach((s) => map.set(s.id, s));
    return map;
  }, [pickups]);

  const suppliersList = useMemo(
    () =>
      assignedRestaurants.map((r) => {
        const stats = statsByRestaurantId.get(r.id);
        return {
          id: r.id,
          name: r.name ?? 'Unknown',
          cuisine: r.cuisine ?? '—',
          image: r.image_url ?? null,
          location: r.address ?? '—',
          contact: r.phone ?? '—',
          email: r.email ?? '—',
          volume: stats?.volume ?? 0,
          quality: stats?.quality ?? '—',
          deliveries: stats?.deliveries ?? 0,
          reliability: stats?.reliability ?? 0,
          lastDelivery: stats?.lastDelivery ?? '—',
          activeDelivery: activeDeliveryByRestaurantId.get(r.id) ?? null,
        };
      }),
    [assignedRestaurants, statsByRestaurantId, activeDeliveryByRestaurantId]
  );

  const filteredSuppliers = suppliersList.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const summaryStats = useMemo(() => {
    const total = suppliersList.length;
    const totalVolume = suppliersList.reduce((sum, s) => sum + s.volume, 0);
    const avgReliability =
      total > 0
        ? Math.round(suppliersList.reduce((sum, s) => sum + s.reliability, 0) / total)
        : 0;
    return { total, totalVolume, avgReliability };
  }, [suppliersList]);

  const getQualityColor = (q) =>
    q === 'B' ? T.gradeB : q === 'C' ? T.gradeC : T.gradeA;
  const getQualityBgColor = (q) =>
    q === 'B' ? `${T.gradeB}20` : q === 'C' ? `${T.gradeC}20` : `${T.gradeA}20`;

  // ─── HEADER (no back button — this is a tab) ─────────────────────────────

  const Header = () => (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={T.card} />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Suppliers</Text>
            <Text style={styles.headerSubtitle}>Active partners</Text>
          </View>
        </View>
      </View>
    </>
  );

  // ─── SUMMARY CARD (now at the top) ───────────────────────────────────────

  const SupplierSummary = () => (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>Supplier Summary</Text>
      <View style={styles.summaryStats}>
        <View style={styles.summaryStat}>
          <Text style={styles.summaryStatValue}>{summaryStats.total}</Text>
          <Text style={styles.summaryStatLabel}>Active Suppliers</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryStat}>
          <Text style={styles.summaryStatValue}>
            {summaryStats.totalVolume.toLocaleString()}
          </Text>
          <Text style={styles.summaryStatLabel}>Litres Supplied</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryStat}>
          <Text style={styles.summaryStatValue}>{summaryStats.avgReliability}%</Text>
          <Text style={styles.summaryStatLabel}>Avg Reliability</Text>
        </View>
      </View>
    </View>
  );

  // ─── SUPPLIER DETAIL MODAL ────────────────────────────────────────────────

  const SupplierDetailModal = () => (
    <Modal
      animationType="slide"
      transparent
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
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={18} color={T.body} />
                </TouchableOpacity>

                <View style={styles.modalHeader}>
                  {selectedSupplier.image ? (
                    <Image
                      source={{ uri: selectedSupplier.image }}
                      style={styles.modalImage}
                    />
                  ) : (
                    <View style={[styles.modalImage, styles.modalImagePlaceholder]}>
                      <Ionicons name="storefront-outline" size={28} color={T.primary} />
                    </View>
                  )}
                  <View style={styles.modalHeaderInfo}>
                    <Text style={styles.modalName}>{selectedSupplier.name}</Text>
                    <View
                      style={[
                        styles.modalQualityTag,
                        { backgroundColor: getQualityBgColor(selectedSupplier.quality) },
                      ]}
                    >
                      <Text
                        style={[
                          styles.modalQualityText,
                          { color: getQualityColor(selectedSupplier.quality) },
                        ]}
                      >
                        Grade {selectedSupplier.quality}
                      </Text>
                    </View>
                  </View>
                </View>

                {selectedSupplier.activeDelivery && (
                  <View style={styles.incomingCard}>
                    <View style={styles.incomingCardHeader}>
                      <Ionicons name="car-outline" size={18} color={T.primary} />
                      <Text style={styles.incomingCardTitle}>Incoming delivery</Text>
                    </View>
                    <Text style={styles.incomingCardText}>
                      {selectedSupplier.activeDelivery.driverName} —{' '}
                      {selectedSupplier.activeDelivery.statusLabel}
                    </Text>
                    {selectedSupplier.activeDelivery.status ===
                      'arrived_manufacturer' && (
                      <TouchableOpacity
                        style={styles.confirmReceivedBtn}
                        onPress={() =>
                          handleConfirmDelivery(selectedSupplier.activeDelivery.pickupId)
                        }
                        activeOpacity={0.85}
                      >
                        <Ionicons name="card-outline" size={16} color={T.white} />
                        <Text style={styles.confirmReceivedBtnText}>
                          Confirm Received & Pay
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                <View style={styles.modalStats}>
                  <View style={styles.modalStat}>
                    <Text style={styles.modalStatValue}>
                      {selectedSupplier.volume.toLocaleString()} L
                    </Text>
                    <Text style={styles.modalStatLabel}>Total Volume</Text>
                  </View>
                  <View style={styles.modalStatDivider} />
                  <View style={styles.modalStat}>
                    <Text style={styles.modalStatValue}>
                      {selectedSupplier.reliability}%
                    </Text>
                    <Text style={styles.modalStatLabel}>Reliability</Text>
                  </View>
                  <View style={styles.modalStatDivider} />
                  <View style={styles.modalStat}>
                    <Text style={styles.modalStatValue}>
                      {selectedSupplier.deliveries}
                    </Text>
                    <Text style={styles.modalStatLabel}>Deliveries</Text>
                  </View>
                </View>

                <View style={styles.modalInfo}>
                  <View style={styles.modalInfoRow}>
                    <Ionicons name="location-outline" size={16} color={T.muted} />
                    <Text style={styles.modalInfoText}>
                      {selectedSupplier.location}
                    </Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Ionicons name="time-outline" size={16} color={T.muted} />
                    <Text style={styles.modalInfoText}>
                      Last delivery: {selectedSupplier.lastDelivery}
                    </Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Ionicons name="call-outline" size={16} color={T.muted} />
                    <Text style={styles.modalInfoText}>{selectedSupplier.contact}</Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Ionicons name="mail-outline" size={16} color={T.muted} />
                    <Text style={styles.modalInfoText}>{selectedSupplier.email}</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.contactButton} activeOpacity={0.85}>
                  <Ionicons name="chatbubble-outline" size={16} color={T.white} />
                  <Text style={styles.contactButtonText}>Contact Supplier</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // ─── SUPPLIER CARD ────────────────────────────────────────────────────────

  const SupplierCard = ({ supplier }) => (
    <TouchableOpacity
      style={styles.supplierCard}
      onPress={() => {
        setSelectedSupplier(supplier);
        setModalVisible(true);
      }}
      activeOpacity={0.9}
    >
      {supplier.image ? (
        <Image source={{ uri: supplier.image }} style={styles.supplierImage} />
      ) : (
        <View style={[styles.supplierImage, styles.supplierImagePlaceholder]}>
          <Ionicons name="storefront-outline" size={24} color={T.primary} />
        </View>
      )}

      <View style={styles.supplierInfo}>
        <View style={styles.supplierHeader}>
          <View style={styles.supplierNameContainer}>
            <Text style={styles.supplierName} numberOfLines={1}>
              {supplier.name}
            </Text>
            <View style={styles.reliabilityBadge}>
              <Ionicons name="star" size={11} color={T.gradeB} />
              <Text style={styles.reliabilityText}>{supplier.reliability}%</Text>
            </View>
          </View>
          <View
            style={[
              styles.supplierQuality,
              { backgroundColor: getQualityBgColor(supplier.quality) },
            ]}
          >
            <Text
              style={[
                styles.supplierQualityText,
                { color: getQualityColor(supplier.quality) },
              ]}
            >
              Grade {supplier.quality}
            </Text>
          </View>
        </View>

        <Text style={styles.supplierCuisine} numberOfLines={1}>
          {supplier.cuisine} • {supplier.location}
        </Text>

        {supplier.activeDelivery && (
          <View style={styles.incomingRow}>
            <Ionicons name="car-outline" size={13} color={T.primary} />
            <Text style={styles.incomingText} numberOfLines={1}>
              {supplier.activeDelivery.driverName} · {supplier.activeDelivery.statusLabel}
            </Text>
          </View>
        )}

        <View style={styles.supplierStats}>
          <View style={styles.supplierStat}>
            <Text style={styles.supplierStatValue}>
              {supplier.volume.toLocaleString()} L
            </Text>
            <Text style={styles.supplierStatLabel}>Total</Text>
          </View>
          <View style={styles.supplierDivider} />
          <View style={styles.supplierStat}>
            <Text style={styles.supplierStatValue}>{supplier.deliveries}</Text>
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
  );

  // ─── EMPTY STATE ──────────────────────────────────────────────────────────

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="storefront-outline" size={26} color={T.primary} />
      </View>
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'No matching suppliers' : 'No suppliers yet'}
      </Text>
      <Text style={styles.emptyText}>
        {searchQuery
          ? 'Try a different search term.'
          : 'Suppliers will appear here once they are assigned to you.'}
      </Text>
    </View>
  );

  // ─── RENDER ──────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* 1. Supplier Summary (moved to top) */}
        <SupplierSummary />

        {/* 2. Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrap}>
            <Ionicons name="search-outline" size={16} color={T.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search suppliers..."
              placeholderTextColor={T.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={16} color={T.muted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 3. Supplier list */}
        <View style={styles.suppliersList}>
          {filteredSuppliers.length === 0 ? (
            <EmptyState />
          ) : (
            filteredSuppliers.map((supplier) => (
              <SupplierCard key={supplier.id} supplier={supplier} />
            ))
          )}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      <SupplierDetailModal />
    </View>
  );
};

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.page },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 24 },

  // Header (white, centered title, no back button)
  header: {
    backgroundColor: T.card,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    ...SH.header,
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

  // Summary card (top of the screen)
  summaryCard: {
    backgroundColor: T.card,
    borderRadius: R.card,
    padding: S.cardPadding,
    borderWidth: 1,
    borderColor: T.border,
    marginHorizontal: S.screenPadding,
    marginTop: S.gap,
    ...SH.card,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: T.ink,
    marginBottom: 14,
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryStat: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, height: 36, backgroundColor: T.divider },
  summaryStatValue: {
    fontSize: 20,
    fontWeight: '800',
    color: T.ink,
    marginBottom: 2,
  },
  summaryStatLabel: {
    fontSize: 11,
    color: T.body,
    textAlign: 'center',
  },

  // Search
  searchContainer: {
    paddingHorizontal: S.screenPadding,
    marginTop: S.gap,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: T.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: T.border,
    ...SH.card,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: T.ink,
    paddingVertical: 6,
  },

  // Suppliers list
  suppliersList: {
    paddingHorizontal: S.screenPadding,
    marginTop: 12,
    gap: 12,
  },
  supplierCard: {
    backgroundColor: T.card,
    borderRadius: R.card,
    padding: 14,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: T.border,
    ...SH.card,
  },
  supplierImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 14,
  },
  supplierImagePlaceholder: {
    backgroundColor: T.paleGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  supplierInfo: { flex: 1 },
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
    paddingRight: 8,
  },
  supplierName: {
    fontSize: 15,
    fontWeight: '600',
    color: T.ink,
  },
  reliabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  reliabilityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#B45309',
  },
  supplierQuality: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  supplierQualityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  supplierCuisine: {
    fontSize: 12,
    color: T.body,
    marginBottom: 8,
  },
  incomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: T.selectedBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  incomingText: {
    fontSize: 11,
    fontWeight: '600',
    color: T.primary,
  },
  supplierStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: T.divider,
  },
  supplierStat: { alignItems: 'center', flex: 1 },
  supplierStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: T.ink,
    marginBottom: 2,
  },
  supplierStatLabel: {
    fontSize: 10,
    color: T.muted,
  },
  supplierLastDelivery: {
    fontSize: 12,
    fontWeight: '600',
    color: T.ink,
    marginBottom: 2,
  },
  supplierDivider: { width: 1, backgroundColor: T.divider },

  // Empty state
  emptyState: {
    backgroundColor: T.card,
    borderRadius: R.card,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.border,
    ...SH.card,
  },
  emptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: T.paleGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: T.ink,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 12,
    color: T.body,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: T.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
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
    backgroundColor: T.divider,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  modalImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginRight: 16,
  },
  modalImagePlaceholder: {
    backgroundColor: T.paleGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeaderInfo: { flex: 1 },
  modalName: {
    fontSize: 18,
    fontWeight: '700',
    color: T.ink,
    marginBottom: 8,
  },
  modalQualityTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  modalQualityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  incomingCard: {
    backgroundColor: T.selectedBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: T.border,
  },
  incomingCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  incomingCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: T.primary,
  },
  incomingCardText: {
    fontSize: 13,
    color: T.ink,
    marginBottom: 4,
  },
  confirmReceivedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: R.pill,
    backgroundColor: T.primary,
    ...SH.button,
  },
  confirmReceivedBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: T.white,
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: T.divider,
    marginBottom: 16,
  },
  modalStat: { alignItems: 'center', flex: 1 },
  modalStatDivider: { width: 1, backgroundColor: T.divider },
  modalStatValue: {
    fontSize: 18,
    fontWeight: '800',
    color: T.primary,
    marginBottom: 4,
  },
  modalStatLabel: { fontSize: 11, color: T.body },
  modalInfo: { gap: 12, marginBottom: 20 },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalInfoText: {
    fontSize: 13,
    color: T.body,
    flex: 1,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: R.pill,
    backgroundColor: T.primary,
    ...SH.button,
  },
  contactButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: T.white,
  },
});

export default SuppliersScreen;