import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  StatusBar,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';

const ProfileScreen = ({ navigation }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  
  const [profile, setProfile] = useState({
    name: 'Kgopotso Baloyi',
    email: 'kgopotso@biodiesel.co.za',
    phone: '+27 123 456 789',
    company: 'BioLoop Manufacturing',
    position: 'Operations Manager',
    location: 'Johannesburg, South Africa',
    joinDate: 'January 2024',
  });

  const [isEditingField, setIsEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');

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
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => navigation.navigate('ManufacturerHome')
        },
      ]
    );
  };

  // Icons
  const EditIcon = ({ color = '#6b7280', size = 18 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 3L21 7L7 21H3V17L17 3Z" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M15 5L19 9" stroke={color} strokeWidth={1.6} strokeLinecap="round"/>
    </Svg>
  );

  const SaveIcon = ({ color = '#fff', size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="20 6 9 17 4 12" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );

  const CancelIcon = ({ color = '#ef4444', size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth={2} strokeLinecap="round"/>
      <Line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth={2} strokeLinecap="round"/>
    </Svg>
  );

  const UserIcon = ({ color = '#6b7280', size = 20 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={1.6}/>
      <Path d="M5 20v-2a7 7 0 0114 0v2" stroke={color} strokeWidth={1.6} strokeLinecap="round"/>
    </Svg>
  );

  const EmailIcon = ({ color = '#6b7280', size = 20 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="4" width="20" height="16" rx="2" stroke={color} strokeWidth={1.6}/>
      <Path d="M22 7L12 13L2 7" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );

  const PhoneIcon = ({ color = '#6b7280', size = 20 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );

  const BuildingIcon = ({ color = '#6b7280', size = 20 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="2" width="16" height="20" rx="2" stroke={color} strokeWidth={1.6}/>
      <Line x1="8" y1="6" x2="16" y2="6" stroke={color} strokeWidth={1.6} strokeLinecap="round"/>
      <Line x1="8" y1="10" x2="16" y2="10" stroke={color} strokeWidth={1.6} strokeLinecap="round"/>
      <Line x1="8" y1="14" x2="12" y2="14" stroke={color} strokeWidth={1.6} strokeLinecap="round"/>
    </Svg>
  );

  const BriefcaseIcon = ({ color = '#6b7280', size = 20 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="7" width="20" height="14" rx="2" stroke={color} strokeWidth={1.6}/>
      <Path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke={color} strokeWidth={1.6} strokeLinecap="round"/>
    </Svg>
  );

  const LocationIcon = ({ color = '#6b7280', size = 20 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke={color} strokeWidth={1.6}/>
      <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth={1.6}/>
    </Svg>
  );

  const CalendarIcon = ({ color = '#6b7280', size = 20 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth={1.6}/>
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth={1.6} strokeLinecap="round"/>
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth={1.6} strokeLinecap="round"/>
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth={1.6}/>
    </Svg>
  );

  const BellIcon = ({ color = '#6b7280', size = 20 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M13.73 21a2 2 0 01-3.46 0" stroke={color} strokeWidth={1.6} strokeLinecap="round"/>
    </Svg>
  );

  const MailIcon = ({ color = '#6b7280', size = 20 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="4" width="20" height="16" rx="2" stroke={color} strokeWidth={1.6}/>
      <Path d="M22 7L12 13L2 7" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );

  const MoonIcon = ({ color = '#6b7280', size = 20 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );

  const FingerprintIcon = ({ color = '#6b7280', size = 20 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 4a4 4 0 014 4v4M12 8a4 4 0 00-4 4v4M8 16a4 4 0 004 4M16 16a4 4 0 01-4 4" stroke={color} strokeWidth={1.6} strokeLinecap="round"/>
      <Path d="M4 12a8 8 0 0116 0" stroke={color} strokeWidth={1.6} strokeLinecap="round"/>
    </Svg>
  );

  const LogoutIcon = ({ color = '#ef4444', size = 20 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
      <Polyline points="16 17 21 12 16 7" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
      <Line x1="21" y1="12" x2="9" y2="12" stroke={color} strokeWidth={1.6} strokeLinecap="round"/>
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
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>My Profile</Text>
            <Text style={styles.headerSubtitle}>Account Settings</Text>
          </View>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setIsEditing(!isEditing)}
          >
            <EditIcon color="#fff" size={18} />
            <Text style={styles.editButtonText}>
              {isEditing ? 'Done' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </>
  );

  const renderEditableField = (label, field, value, icon) => {
    const isEditingThis = isEditingField === field;
    
    if (isEditing && isEditingThis) {
      return (
        <View style={styles.profileField}>
          <View style={styles.fieldIcon}>{icon}</View>
          <View style={styles.fieldContent}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <View style={styles.editContainer}>
              <TextInput
                style={styles.fieldInput}
                value={editValue}
                onChangeText={setEditValue}
                placeholder={value}
                placeholderTextColor="#9ca3af"
                autoFocus
              />
              <TouchableOpacity onPress={() => handleSave(field)} style={styles.saveButton}>
                <SaveIcon color="#fff" size={14} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
                <CancelIcon color="#ef4444" size={14} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }
    
    return (
      <View style={styles.profileField}>
        <View style={styles.fieldIcon}>{icon}</View>
        <View style={styles.fieldContent}>
          <Text style={styles.fieldLabel}>{label}</Text>
          <Text style={styles.fieldValue}>{value}</Text>
        </View>
        {isEditing && (
          <TouchableOpacity onPress={() => handleEdit(field, value)} style={styles.fieldEditIcon}>
            <EditIcon color="#8b5cf6" size={16} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Image Section */}
        <View style={styles.profileImageSection}>
          <LinearGradient
            colors={['#8b5cf6', '#7c3aed']}
            style={styles.profileImageBorder}
          >
            <View style={styles.profileImageContainer}>
              <Text style={styles.profileInitials}>KB</Text>
            </View>
          </LinearGradient>
          {isEditing && (
            <TouchableOpacity style={styles.changePhotoButton}>
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Personal Information Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          {renderEditableField('Full Name', 'name', profile.name, <UserIcon size={20} />)}
          {renderEditableField('Email Address', 'email', profile.email, <EmailIcon size={20} />)}
          {renderEditableField('Phone Number', 'phone', profile.phone, <PhoneIcon size={20} />)}
          {renderEditableField('Location', 'location', profile.location, <LocationIcon size={20} />)}
        </View>

        {/* Professional Information Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Professional Information</Text>
          
          {renderEditableField('Company', 'company', profile.company, <BuildingIcon size={20} />)}
          {renderEditableField('Position', 'position', profile.position, <BriefcaseIcon size={20} />)}
          
          <View style={styles.profileField}>
            <View style={styles.fieldIcon}><CalendarIcon size={20} /></View>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>Member Since</Text>
              <Text style={styles.fieldValue}>{profile.joinDate}</Text>
            </View>
          </View>
        </View>

        {/* Preferences Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceLeft}>
              <BellIcon size={20} />
              <Text style={styles.preferenceLabel}>Push Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#e5e7eb', true: '#8b5cf6' }}
              thumbColor={notificationsEnabled ? '#fff' : '#f3f4f6'}
            />
          </View>
          
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceLeft}>
              <MailIcon size={20} />
              <Text style={styles.preferenceLabel}>Email Alerts</Text>
            </View>
            <Switch
              value={emailAlertsEnabled}
              onValueChange={setEmailAlertsEnabled}
              trackColor={{ false: '#e5e7eb', true: '#8b5cf6' }}
              thumbColor={emailAlertsEnabled ? '#fff' : '#f3f4f6'}
            />
          </View>
          
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceLeft}>
              <MoonIcon size={20} />
              <Text style={styles.preferenceLabel}>Dark Mode</Text>
            </View>
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: '#e5e7eb', true: '#8b5cf6' }}
              thumbColor={darkModeEnabled ? '#fff' : '#f3f4f6'}
            />
          </View>
          
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceLeft}>
              <FingerprintIcon size={20} />
              <Text style={styles.preferenceLabel}>Biometric Login</Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={setBiometricEnabled}
              trackColor={{ false: '#e5e7eb', true: '#8b5cf6' }}
              thumbColor={biometricEnabled ? '#fff' : '#f3f4f6'}
            />
          </View>
        </View>

        {/* App Info Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>App Information</Text>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>2.0.0</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Build Number</Text>
            <Text style={styles.infoValue}>2024.001</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Terms of Service</Text>
            <Text style={styles.infoLink}>View →</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Privacy Policy</Text>
            <Text style={styles.infoLink}>View →</Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogoutIcon size={20} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
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
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  profileImageSection: {
    alignItems: 'center',
    marginTop: -30,
    marginBottom: 20,
  },
  profileImageBorder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageContainer: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    fontSize: 36,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  changePhotoButton: {
    marginTop: 8,
  },
  changePhotoText: {
    fontSize: 13,
    color: '#8b5cf6',
    fontWeight: '500',
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 8,
  },
  profileField: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  fieldIcon: {
    width: 32,
    alignItems: 'center',
  },
  fieldContent: {
    flex: 1,
    marginLeft: 8,
  },
  fieldLabel: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  fieldInput: {
    fontSize: 15,
    color: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#8b5cf6',
    paddingVertical: 4,
    minWidth: 150,
  },
  fieldEditIcon: {
    padding: 8,
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveButton: {
    backgroundColor: '#10b981',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#fee2e2',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  preferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  preferenceLabel: {
    fontSize: 15,
    color: '#111827',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  infoLink: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 14,
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  footer: {
    height: 20,
  },
});

export default ProfileScreen;