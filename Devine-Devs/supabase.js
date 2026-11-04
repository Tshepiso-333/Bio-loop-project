import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// EXPO_PUBLIC_* is inlined into the bundle at build time (set in .env locally
// and in the Vercel project for web). The fallbacks keep native builds that
// have no .env working. Only the publishable key ever belongs here — RLS is
// the security boundary, never a service-role key.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://dhgveofhbvxqhpywapel.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_BHSEBgH6o1rqAZO1wmAyRQ_rHaEy_-y';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, 
  },
});
