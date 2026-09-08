function isFilled(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return !Number.isNaN(value);
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return Boolean(value);
}

const BASE_REQUIRED = [
  { key: 'full_name', label: 'Full name' },
  { key: 'phone', label: 'Phone number' },
  { key: 'city', label: 'City' },
  { key: 'province', label: 'Province' },
];

const ROLE_REQUIRED = {
  collector: [
    { key: 'vehicle_type', label: 'Vehicle type' },
    { key: 'vehicle_make', label: 'Vehicle make' },
    { key: 'vehicle_registration', label: 'Vehicle registration' },
    { key: 'drivers_license_number', label: "Driver's license number" },
    { key: 'years_experience', label: 'Years of experience' },
    { key: 'languages', label: 'Languages' },
    { key: 'bio', label: 'Bio' },
  ],
  restaurant: [
    { key: 'owner_name', label: 'Owner name' },
    { key: 'business_type', label: 'Business type' },
    { key: 'operating_hours', label: 'Operating hours' },
    { key: 'pickup_instructions', label: 'Pickup instructions' },
    { key: 'estimated_monthly_oil_liters', label: 'Estimated monthly oil (liters)' },
  ],
  manufacturer: [
    { key: 'contact_person', label: 'Contact person' },
    { key: 'company_registration_number', label: 'Company registration number' },
    { key: 'company_description', label: 'Company description' },
    { key: 'accepted_grades', label: 'Accepted grades' },
    { key: 'years_in_business', label: 'Years in business' },
  ],
};

/** Recommended but not blocking — shown in completion UI as optional. */
const ROLE_RECOMMENDED = {
  collector: [{ key: 'profile_image_url', label: 'Profile photo' }],
  restaurant: [
    { key: 'profile_image_url', label: 'Profile photo' },
    { key: 'cover_image_url', label: 'Cover photo' },
  ],
  manufacturer: [
    { key: 'profile_image_url', label: 'Profile photo' },
    { key: 'cover_image_url', label: 'Cover photo' },
  ],
};

function checkFields(record, fields) {
  const missing = [];
  fields.forEach(({ key, label }) => {
    if (!isFilled(record?.[key])) missing.push({ key, label });
  });
  return missing;
}

export function getProfileCompletionStatus(profile) {
  if (!profile?.role) {
    return { isComplete: false, missing: [], recommendedMissing: [], percent: 0 };
  }

  if (profile.role === 'admin') {
    return { isComplete: true, missing: [], recommendedMissing: [], percent: 100 };
  }

  const business = profile.businessDetails;
  if (!business) {
    return {
      isComplete: false,
      missing: [{ key: 'business_profile', label: 'Business profile record' }],
      recommendedMissing: [],
      percent: 0,
    };
  }

  const missingBase = checkFields(profile, BASE_REQUIRED);
  const missingRole = checkFields(business, ROLE_REQUIRED[profile.role] ?? []);
  const missing = [...missingBase, ...missingRole];
  const recommendedMissing = checkFields(business, ROLE_RECOMMENDED[profile.role] ?? []);

  const totalRequired =
    BASE_REQUIRED.length + (ROLE_REQUIRED[profile.role]?.length ?? 0);
  const filled = totalRequired - missing.length;
  const percent = totalRequired > 0 ? Math.round((filled / totalRequired) * 100) : 100;

  return {
    isComplete: missing.length === 0,
    missing,
    recommendedMissing,
    percent: Math.max(0, Math.min(100, percent)),
  };
}

export { BASE_REQUIRED, ROLE_REQUIRED, ROLE_RECOMMENDED, isFilled };
