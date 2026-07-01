/** Form field configs for profile edit / completion screens. */

export const BASE_PROFILE_FIELDS = [
  { key: 'full_name', label: 'Full name', placeholder: 'Your full name', required: true },
  { key: 'phone', label: 'Phone', placeholder: '+27 ...', keyboardType: 'phone-pad', required: true },
  { key: 'city', label: 'City', placeholder: 'Johannesburg', required: true },
  { key: 'province', label: 'Province', placeholder: 'Gauteng', required: true },
  { key: 'bio', label: 'Bio', placeholder: 'Tell us about yourself', multiline: true, required: false },
  { key: 'profile_image_url', label: 'Profile photo', type: 'image', imageTarget: 'base' },
];

export const COLLECTOR_FIELDS = [
  { key: 'vehicle_type', label: 'Vehicle type', placeholder: 'Van, Truck...', required: true },
  { key: 'vehicle_make', label: 'Vehicle make', placeholder: 'Toyota', required: true },
  { key: 'vehicle_model', label: 'Vehicle model', placeholder: 'Hilux' },
  { key: 'vehicle_registration', label: 'Registration', placeholder: 'ABC 123 GP', required: true },
  { key: 'drivers_license_number', label: "Driver's license", placeholder: 'License number', required: true },
  { key: 'years_experience', label: 'Years experience', placeholder: '5', keyboardType: 'numeric', required: true },
  { key: 'languages', label: 'Languages', placeholder: 'English, Zulu', required: true },
  { key: 'district', label: 'District', placeholder: 'Central District' },
  { key: 'route_name', label: 'Route name', placeholder: 'Route #12' },
  { key: 'bio', label: 'Bio', placeholder: 'Experience and notes', multiline: true, required: true },
  { key: 'profile_image_url', label: 'Profile photo', type: 'image', imageTarget: 'business' },
];

export const RESTAURANT_FIELDS = [
  { key: 'name', label: 'Restaurant name', placeholder: 'Business name', required: true },
  { key: 'owner_name', label: 'Owner name', placeholder: 'Owner full name', required: true },
  { key: 'business_type', label: 'Business type', placeholder: 'Fast food, Cafe...', required: true },
  { key: 'operating_hours', label: 'Operating hours', placeholder: 'Mon–Sat 9am–10pm', required: true },
  { key: 'pickup_instructions', label: 'Pickup instructions', placeholder: 'Gate code, loading bay...', multiline: true, required: true },
  {
    key: 'estimated_monthly_oil_liters',
    label: 'Est. monthly oil (L)',
    placeholder: '200',
    keyboardType: 'numeric',
    required: true,
  },
  { key: 'address', label: 'Address', placeholder: 'Street address' },
  { key: 'district', label: 'District', placeholder: 'District' },
  { key: 'cuisine', label: 'Cuisine', placeholder: 'Italian, Fast food...' },
  { key: 'website_url', label: 'Website', placeholder: 'https://...' },
  { key: 'google_business_url', label: 'Google Business URL', placeholder: 'https://...' },
  { key: 'preferred_pickup_days', label: 'Preferred pickup days', placeholder: 'Mon, Wed, Fri', type: 'json-array' },
  { key: 'profile_image_url', label: 'Profile photo', type: 'image', imageTarget: 'business' },
  { key: 'cover_image_url', label: 'Cover photo', type: 'image', imageTarget: 'business' },
];

export const MANUFACTURER_FIELDS = [
  { key: 'name', label: 'Company name', placeholder: 'Company name', required: true },
  { key: 'contact_person', label: 'Contact person', placeholder: 'Full name', required: true },
  { key: 'company_registration_number', label: 'Registration number', placeholder: 'Reg. number', required: true },
  { key: 'company_description', label: 'Description', placeholder: 'What your company does', multiline: true, required: true },
  { key: 'accepted_grades', label: 'Accepted grades', placeholder: 'A, B, C', type: 'json-array', required: true },
  { key: 'years_in_business', label: 'Years in business', placeholder: '10', keyboardType: 'numeric', required: true },
  { key: 'address', label: 'Address', placeholder: 'Company address' },
  { key: 'contact_phone', label: 'Contact phone', placeholder: '+27 ...', keyboardType: 'phone-pad' },
  { key: 'contact_email', label: 'Contact email', placeholder: 'email@company.com', keyboardType: 'email-address' },
  { key: 'website_url', label: 'Website', placeholder: 'https://...' },
  { key: 'position', label: 'Your position', placeholder: 'Operations Manager' },
  { key: 'profile_image_url', label: 'Profile photo', type: 'image', imageTarget: 'business' },
  { key: 'cover_image_url', label: 'Cover photo', type: 'image', imageTarget: 'business' },
];

export function getFieldsForRole(role) {
  switch (role) {
    case 'collector':
      return { base: BASE_PROFILE_FIELDS, business: COLLECTOR_FIELDS, businessTitle: 'Vehicle & collector details' };
    case 'restaurant':
      return { base: BASE_PROFILE_FIELDS, business: RESTAURANT_FIELDS, businessTitle: 'Restaurant details' };
    case 'manufacturer':
      return { base: BASE_PROFILE_FIELDS, business: MANUFACTURER_FIELDS, businessTitle: 'Company details' };
    default:
      return { base: BASE_PROFILE_FIELDS, business: [], businessTitle: '' };
  }
}

export function buildFormState(profile) {
  const base = {
    full_name: profile?.full_name ?? '',
    phone: profile?.phone ?? '',
    city: profile?.city ?? '',
    province: profile?.province ?? '',
    bio: profile?.bio ?? '',
    profile_image_url: profile?.profile_image_url ?? '',
  };

  const business = { ...(profile?.businessDetails ?? {}) };

  Object.keys(business).forEach((key) => {
    const val = business[key];
    if (val !== null && typeof val === 'object') {
      business[key] = Array.isArray(val) ? val.join(', ') : JSON.stringify(val);
    } else if (val === null || val === undefined) {
      business[key] = '';
    }
  });

  return { base, business };
}

export function parseFormPayload(base, business, role) {
  const parsedBusiness = { ...business };

  if (role === 'restaurant' && parsedBusiness.preferred_pickup_days) {
    parsedBusiness.preferred_pickup_days = parsedBusiness.preferred_pickup_days
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (role === 'manufacturer' && parsedBusiness.accepted_grades) {
    parsedBusiness.accepted_grades = parsedBusiness.accepted_grades
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
  }

  if (parsedBusiness.estimated_monthly_oil_liters !== undefined && parsedBusiness.estimated_monthly_oil_liters !== '') {
    parsedBusiness.estimated_monthly_oil_liters = Number(parsedBusiness.estimated_monthly_oil_liters);
  }

  if (parsedBusiness.years_experience !== undefined && parsedBusiness.years_experience !== '') {
    parsedBusiness.years_experience = Number(parsedBusiness.years_experience);
  }

  if (parsedBusiness.years_in_business !== undefined && parsedBusiness.years_in_business !== '') {
    parsedBusiness.years_in_business = Number(parsedBusiness.years_in_business);
  }

  return { base, business: parsedBusiness };
}
