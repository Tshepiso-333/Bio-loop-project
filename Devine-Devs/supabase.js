import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dhgveofhbvxqhpywapel.supabase.co';
const supabaseKey = 'sb_publishable_BHSEBgH6o1rqAZO1wmAyRQ_rHaEy_-y';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, 
  },
});