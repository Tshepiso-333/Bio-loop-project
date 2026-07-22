import React, { useCallback, useEffect, useMemo, useState, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../../AuthContext';
import { useProfile } from '../../hooks/useProfile';
import ProfileAvatar from './ProfileAvatar';
import ProfileField from './ProfileField';
import {
  buildFormState,
  getFieldsForRole,
  parseFormPayload,
} from '../../lib/profileFields';
import { getProfileCompletionStatus } from '../../lib/profileCompletion';
import { saveRoleProfile } from '../../services/profileService';
import { uploadProfileImage } from '../../services/storageService';
import { RestaurantContext } from '../../contexts/RestaurantContext';
import { CollectorContext } from '../../contexts/CollectorContext';
import { ManufacturerContext } from '../../contexts/ManufacturerContext';
import { ONB_COLORS, ONB_FONTS } from '../../onboarding/onboardingTokens';

// Shared across roles, so themed from the brand-level onboarding tokens
// (same source authTheme.js uses) rather than any one module's theme.
const THEME = {
  primary: ONB_COLORS.primary, // '#15643E' forest green
  bg: '#F6F8F7',
  card: '#FFFFFF',
  border: '#E4EDE7',
  ink: '#122A1F',
  body: '#6B7F75',
  muted: '#A9B5AD',
  white: '#FFFFFF',
  progressTrack: '#E4EDE7',
};

const FONTS = {
  extraBold: ONB_FONTS.extraBold,
  bold: ONB_FONTS.bold,
  semiBold: ONB_FONTS.semiBold,
  medium: ONB_FONTS.medium,
};

export default function ProfileEditScreen({
  mode = 'edit',
  onDone,
  onSkip,
}) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { profile, role, refreshProfile } = useProfile();
  const isCompletion = mode === 'completion';

  const restaurantCtx = useContext(RestaurantContext);
  const collectorCtx = useContext(CollectorContext);
  const manufacturerCtx = useContext(ManufacturerContext);

  const refreshRoleData = useCallback(async () => {
    if (role === 'restaurant' && restaurantCtx?.refreshRestaurant) {
      await restaurantCtx.refreshRestaurant();
    }
    if (role === 'collector' && collectorCtx?.refreshCollector) {
      await collectorCtx.refreshCollector();
    }
    if (role === 'manufacturer' && manufacturerCtx?.refreshManufacturer) {
      await manufacturerCtx.refreshManufacturer();
    }
  }, [role, restaurantCtx, collectorCtx, manufacturerCtx]);

  const fieldConfig = useMemo(() => getFieldsForRole(role), [role]);
  const [form, setForm] = useState({ base: {}, business: {} });
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm(buildFormState(profile));
    }
  }, [profile]);

  const completion = useMemo(
    () => getProfileCompletionStatus(profile),
    [profile]
  );

  const updateBase = (key, value) => {
    setForm((prev) => ({ ...prev, base: { ...prev.base, [key]: value } }));
  };

  const updateBusiness = (key, value) => {
    setForm((prev) => ({ ...prev, business: { ...prev.business, [key]: value } }));
  };

  const pickImage = useCallback(
    async (target, key) => {
      try {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission needed', 'Allow photo library access to upload a profile image.');
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.85,
        });

        if (result.canceled || !result.assets?.[0]?.uri) return;

        setUploadingImage(true);
        try {
          const publicUrl = await uploadProfileImage({
            userId: user.id,
            localUri: result.assets[0].uri,
            folder: target === 'base' ? 'profiles' : role,
          });

          if (target === 'base') {
            updateBase(key, publicUrl);
          } else {
            updateBusiness(key, publicUrl);
            if (key === 'profile_image_url') {
              updateBase('profile_image_url', publicUrl);
            }
          }
        } catch (uploadErr) {
          Alert.alert(
            'Upload failed',
            uploadErr.message ?? 'Could not upload image. Ensure the profile-images bucket exists in Supabase Storage.'
          );
        } finally {
          setUploadingImage(false);
        }
      } catch (err) {
        Alert.alert('Error', err.message ?? 'Could not open image picker.');
      }
    },
    [role, user?.id]
  );

  const handleSave = async () => {
    if (!user?.id || !role) return;

    setSaving(true);
    try {
      const { base, business } = parseFormPayload(form.base, form.business, role);

      if (business.profile_image_url && !base.profile_image_url) {
        base.profile_image_url = business.profile_image_url;
      }

      await saveRoleProfile(user.id, role, { base, business });
      await refreshProfile();
      await refreshRoleData();

      if (onDone) {
        onDone();
      } else {
        Alert.alert('Saved', 'Your profile has been updated.');
      }
    } catch (err) {
      Alert.alert('Save failed', err.message ?? 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  const renderFields = (fields, section) =>
    fields
      .filter((field) => field.type !== 'image' || section !== 'duplicate')
      .map((field) => {
        if (field.type === 'image') {
          const isBase = field.imageTarget === 'base';
          const imageUrl = isBase ? form.base.profile_image_url : form.business[field.key];
          const displayName = form.base.full_name || form.business.name || form.business.full_name;

          return (
            <View key={field.key} style={styles.imageSection}>
              <Text style={styles.sectionLabel}>{field.label}</Text>
              <ProfileAvatar
                name={displayName}
                imageUrl={imageUrl}
                size={96}
                editable
                uploading={uploadingImage}
                onPress={() => pickImage(field.imageTarget, field.key)}
              />
              <Text style={styles.imageHint}>Tap to upload a photo</Text>
            </View>
          );
        }

        const isBase = section === 'base';
        const value = isBase ? form.base[field.key] : form.business[field.key];
        const onChange = isBase
          ? (text) => updateBase(field.key, text)
          : (text) => updateBusiness(field.key, text);

        if (field.type === 'select') {
          return (
            <View key={field.key} style={styles.selectWrap}>
              <Text style={styles.selectLabel}>
                {field.label}
                {isCompletion && field.required ? <Text style={styles.selectRequired}> *</Text> : null}
              </Text>
              <View style={styles.chipRow}>
                {field.options.map((option) => {
                  const active = value === option;
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => onChange(option)}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{option}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        }

        return (
          <ProfileField
            key={field.key}
            label={field.label}
            value={value}
            onChangeText={onChange}
            placeholder={field.placeholder}
            multiline={field.multiline}
            keyboardType={field.keyboardType}
            required={isCompletion && field.required}
          />
        );
      });

  if (!profile || !role || role === 'admin') {
    return null;
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>
          {isCompletion ? 'Complete your profile' : 'Edit profile'}
        </Text>
        {isCompletion ? (
          <>
            <Text style={styles.headerSubtitle}>
              {completion.percent}% complete — add the details below to get started.
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(100, Math.max(0, completion.percent))}%` },
                ]}
              />
            </View>
          </>
        ) : (
          <Text style={styles.headerSubtitle}>Update your account and business information.</Text>
        )}
        {isCompletion && completion.missing.length > 0 ? (
          <Text style={styles.missingHint}>
            Missing: {completion.missing.slice(0, 3).map((m) => m.label).join(', ')}
            {completion.missing.length > 3 ? '…' : ''}
          </Text>
        ) : null}
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account</Text>
          {renderFields(fieldConfig.base, 'base')}
        </View>

        {fieldConfig.business.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{fieldConfig.businessTitle}</Text>
            {renderFields(fieldConfig.business, 'business')}
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={THEME.white} />
          ) : (
            <Text style={styles.saveBtnText}>
              {isCompletion ? 'Save & continue' : 'Save changes'}
            </Text>
          )}
        </TouchableOpacity>

        {isCompletion && onSkip ? (
          <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
            <Text style={styles.skipBtnText}>Skip for now</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: THEME.bg },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 18,
    backgroundColor: THEME.bg,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: FONTS.extraBold,
    color: THEME.ink,
  },
  headerSubtitle: {
    marginTop: 6,
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: THEME.body,
    lineHeight: 20,
  },
  progressTrack: {
    marginTop: 12,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.progressTrack,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: THEME.primary,
  },
  missingHint: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: THEME.muted,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: THEME.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: '#122A1F',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: THEME.ink,
    marginBottom: 12,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionLabel: {
    alignSelf: 'flex-start',
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: THEME.body,
    marginBottom: 10,
  },
  imageHint: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: THEME.muted,
  },
  selectWrap: { marginBottom: 14 },
  selectLabel: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 8 },
  selectRequired: { color: '#DC2626' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: { backgroundColor: THEME.primary, borderColor: THEME.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: '#334155' },
  chipTextActive: { color: '#fff' },
  saveBtn: {
    backgroundColor: THEME.primary,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: THEME.primary,
    shadowOpacity: 0.32,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: {
    color: THEME.white,
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  skipBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  skipBtnText: {
    color: THEME.muted,
    fontSize: 14,
    fontFamily: FONTS.semiBold,
  },
});
