// screens/manufacturer/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Switch,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../AuthContext';
import { useManufacturerContext } from '../../src/contexts/ManufacturerContext';
import { useProfile } from '../../src/hooks/useProfile';
import ProfileAvatar from '../../src/components/profile/ProfileAvatar';
import VerifiedBadge from '../../src/components/profile/VerifiedBadge';

// ─── THEME (matches Dashboard / Quality / Finance / Suppliers / Alerts) ──────

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

  danger: '#DC2626',
  dangerBg: '#FFF1F1',
  dangerBorder: '#FECACA',
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
};

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

const ProfileScreen = ({ onBack }) => {
  const navigation = useNavigation();
  const { signOut } = useAuth();
  const { profile: authProfile } = useProfile();
  const { manufacturer } = useManufacturerContext();
  const insets = useSafeAreaInsets();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const [isEditingField, setIsEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');

  const [profile, setProfile] = useState({
    name: manufacturer?.name ?? '—',
    email: manufacturer?.contact_email ?? authProfile?.email ?? '—',
    phone: manufacturer?.contact_phone ?? authProfile?.phone ?? '—',
    company: manufacturer?.name ?? '—',
    position: manufacturer?.position ?? manufacturer?.contact_person ?? '—',
    location: manufacturer?.address ?? '—',
    joinDate: manufacturer?.created_at
      ? new Date(manufacturer.created_at).toLocaleDateString()
      : '—',
    description: manufacturer?.company_description ?? '',
    registration: manufacturer?.company_registration_number ?? '',
    grades: Array.isArray(manufacturer?.accepted_grades)
      ? manufacturer.accepted_grades.join(', ')
      : manufacturer?.accepted_grades ?? '',
    yearsInBusiness: manufacturer?.years_in_business ?? '',
  });

  useEffect(() => {
    if (!manufacturer) return;
    setProfile({
      name: manufacturer.name ?? '—',
      email: manufacturer.contact_email ?? authProfile?.email ?? '—',
      phone: manufacturer.contact_phone ?? authProfile?.phone ?? '—',
      company: manufacturer.name ?? '—',
      position: manufacturer.position ?? manufacturer.contact_person ?? '—',
      location: manufacturer.address ?? '—',
      joinDate: manufacturer.created_at
        ? new Date(manufacturer.created_at).toLocaleDateString()
        : '—',
      description: manufacturer.company_description ?? '',
      registration: manufacturer.company_registration_number ?? '',
      grades: Array.isArray(manufacturer.accepted_grades)
        ? manufacturer.accepted_grades.join(', ')
        : manufacturer.accepted_grades ?? '',
      yearsInBusiness: manufacturer.years_in_business ?? '',
    });
  }, [manufacturer, authProfile]);

  const handleEdit = (field, value) => {
    setIsEditingField(field);
    setEditValue(value);
  };

  const handleSave = (field) => {
    setProfile({ ...profile, [field]: editValue });
    setIsEditingField(null);
    setEditValue('');
  };

  const handleCancel = () => {
    setIsEditingField(null);
    setEditValue('');
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: signOut },
    ]);
  };

  // ─── Back button (works from stack, tab, or parent callback) ─────────────

  const goBack = () => {
    if (typeof onBack === 'function') return onBack();
    if (navigation.canGoBack?.()) return navigation.goBack();
    navigation.navigate('ManufacturerDashboardScreen');
  };

  // ─── Editable field row ──────────────────────────────────────────────────

  const renderEditableField = (label, field, value, iconName) => {
    const isEditingThis = isEditingField === field;

    return (
      <View style={styles.fieldRow}>
        <View style={styles.fieldIconWrap}>
          <Ionicons name={iconName} size={18} color={T.primary} />
        </View>

        <View style={styles.fieldContent}>
          <Text style={styles.fieldLabel}>{label}</Text>
          {isEditingThis ? (
            <View style={styles.editRow}>
              <TextInput
                style={styles.fieldInput}
                value={editValue}
                onChangeText={setEditValue}
                placeholder={value}
                placeholderTextColor={T.muted}
                autoFocus
              />
              <TouchableOpacity
                onPress={() => handleSave(field)}
                style={styles.saveBtn}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="checkmark" size={14} color={T.white} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCancel}
                style={styles.cancelBtn}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="close" size={14} color={T.danger} />
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.fieldValue} numberOfLines={2}>
              {value}
            </Text>
          )}
        </View>

        {!isEditingThis && (
          <TouchableOpacity
            onPress={() => handleEdit(field, value)}
            style={styles.fieldEditBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={16} color={T.muted} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // ─── Read-only field row ─────────────────────────────────────────────────

  const renderReadOnlyField = (label, value, iconName) => {
    if (!value && value !== 0) return null;
    return (
      <View style={styles.fieldRow}>
        <View style={styles.fieldIconWrap}>
          <Ionicons name={iconName} size={18} color={T.primary} />
        </View>
        <View style={styles.fieldContent}>
          <Text style={styles.fieldLabel}>{label}</Text>
          <Text style={styles.fieldValue}>{String(value)}</Text>
        </View>
      </View>
    );
  };

  // ─── Preference row ──────────────────────────────────────────────────────

  const PreferenceRow = ({ iconName, label, value, onChange }) => (
    <View style={styles.preferenceRow}>
      <View style={styles.preferenceLeft}>
        <View style={styles.fieldIconWrap}>
          <Ionicons name={iconName} size={18} color={T.primary} />
        </View>
        <Text style={styles.preferenceLabel}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: T.border, true: T.primary }}
        thumbColor={T.white}
        ios_backgroundColor={T.border}
      />
    </View>
  );

  // ─── Section wrapper ─────────────────────────────────────────────────────

  const Section = ({ title, children }) => (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={T.card} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={goBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color={T.ink} />
          </TouchableOpacity>

          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Profile</Text>
            <Text style={styles.headerSubtitle}>Account settings</Text>
          </View>

          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => navigation?.navigate?.('ProfileEdit')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={20} color={T.ink} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile identity card */}
        <View style={styles.identityCard}>
          <ProfileAvatar
            name={manufacturer?.name ?? profile.name}
            imageUrl={manufacturer?.profile_image_url ?? authProfile?.profile_image_url}
            size={88}
          />
          <Text style={styles.identityName} numberOfLines={2}>
            {manufacturer?.name ?? profile.name}
          </Text>
          <Text style={styles.identitySub} numberOfLines={1}>
            {profile.position !== '—' ? profile.position : 'Manufacturer'}
            {profile.location !== '—' ? ` · ${profile.location}` : ''}
          </Text>
          <VerifiedBadge isVerified={manufacturer?.is_verified} style={{ marginTop: 8 }} />
        </View>

        {/* Personal Information */}
        <Section title="Personal Information">
          {renderEditableField('Full name', 'name', profile.name, 'person-outline')}
          {renderEditableField('Email', 'email', profile.email, 'mail-outline')}
          {renderEditableField('Phone', 'phone', profile.phone, 'call-outline')}
          {renderEditableField('Location', 'location', profile.location, 'location-outline')}
        </Section>

        {/* Professional Information */}
        <Section title="Business Information">
          {renderEditableField('Company', 'company', profile.company, 'business-outline')}
          {renderEditableField('Position', 'position', profile.position, 'briefcase-outline')}
          {renderReadOnlyField('Registration', profile.registration, 'document-text-outline')}
          {renderReadOnlyField('Description', profile.description, 'information-circle-outline')}
          {renderReadOnlyField('Accepted grades', profile.grades, 'shield-checkmark-outline')}
          {renderReadOnlyField('Years in business', profile.yearsInBusiness, 'calendar-outline')}
          {renderReadOnlyField('Member since', profile.joinDate, 'time-outline')}
        </Section>

        {/* Preferences */}
        <Section title="Preferences">
          <PreferenceRow
            iconName="notifications-outline"
            label="Push notifications"
            value={notificationsEnabled}
            onChange={setNotificationsEnabled}
          />
          <PreferenceRow
            iconName="mail-outline"
            label="Email alerts"
            value={emailAlertsEnabled}
            onChange={setEmailAlertsEnabled}
          />
          <PreferenceRow
            iconName="moon-outline"
            label="Dark mode"
            value={darkModeEnabled}
            onChange={setDarkModeEnabled}
          />
          <PreferenceRow
            iconName="finger-print-outline"
            label="Biometric login"
            value={biometricEnabled}
            onChange={setBiometricEnabled}
          />
        </Section>

        {/* App Information */}
        <Section title="App Information">
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>2.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Build number</Text>
            <Text style={styles.infoValue}>2024.001</Text>
          </View>
          <TouchableOpacity style={styles.infoRow} activeOpacity={0.7}>
            <Text style={styles.infoLabel}>Terms of Service</Text>
            <Text style={styles.infoLink}>View →</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.infoRow, { borderBottomWidth: 0 }]}
            activeOpacity={0.7}
          >
            <Text style={styles.infoLabel}>Privacy Policy</Text>
            <Text style={styles.infoLink}>View →</Text>
          </TouchableOpacity>
        </Section>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <Ionicons name="log-out-outline" size={18} color={T.danger} />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.page },
  scrollContent: { paddingBottom: 24 },

  // Header
  header: {
    backgroundColor: T.card,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    ...SH.header,
  },
  headerContent: {
    paddingHorizontal: S.screenPadding,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: T.paleGreen,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.border,
  },
  headerActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: T.paleGreen,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.border,
  },
  headerTextContainer: { alignItems: 'center', flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: T.ink },
  headerSubtitle: { fontSize: 11, color: T.body, marginTop: 2 },

  // Identity card (avatar + name)
  identityCard: {
    backgroundColor: T.card,
    borderRadius: R.card,
    padding: S.cardPadding,
    borderWidth: 1,
    borderColor: T.border,
    marginHorizontal: S.screenPadding,
    marginTop: S.gap,
    alignItems: 'center',
    ...SH.card,
  },
  identityName: {
    fontSize: 18,
    fontWeight: '700',
    color: T.ink,
    marginTop: 12,
    textAlign: 'center',
  },
  identitySub: {
    fontSize: 12,
    color: T.body,
    marginTop: 4,
    textAlign: 'center',
  },

  // Section card
  sectionCard: {
    backgroundColor: T.card,
    borderRadius: R.card,
    padding: S.cardPadding,
    borderWidth: 1,
    borderColor: T.border,
    marginHorizontal: S.screenPadding,
    marginTop: S.gap,
    ...SH.card,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: T.ink,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  // Field row (editable / read-only)
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: T.divider,
  },
  fieldIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: T.paleGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fieldContent: { flex: 1 },
  fieldLabel: {
    fontSize: 11,
    color: T.muted,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  fieldValue: {
    fontSize: 14,
    color: T.ink,
    fontWeight: '600',
  },
  fieldEditBtn: { padding: 6 },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fieldInput: {
    flex: 1,
    fontSize: 14,
    color: T.ink,
    fontWeight: '600',
    borderBottomWidth: 1,
    borderBottomColor: T.primary,
    paddingVertical: 2,
  },
  saveBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: T.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: T.dangerBg,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Preferences
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: T.divider,
  },
  preferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  preferenceLabel: {
    fontSize: 14,
    color: T.ink,
    fontWeight: '500',
  },

  // Info rows (app info)
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: T.divider,
  },
  infoLabel: { fontSize: 13, color: T.body },
  infoValue: { fontSize: 13, color: T.ink, fontWeight: '600' },
  infoLink: { fontSize: 13, color: T.primary, fontWeight: '600' },

  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: S.screenPadding,
    marginTop: S.gap,
    paddingVertical: 14,
    borderRadius: R.pill,
    backgroundColor: T.dangerBg,
    borderWidth: 1,
    borderColor: T.dangerBorder,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: T.danger,
  },
});

export default ProfileScreen;