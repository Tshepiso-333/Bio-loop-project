import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cqpzfwbecnwtlhkbnixd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxcHpmd2JlY253dGxoa2JuaXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwODgwMDUsImV4cCI6MjA5NjY2NDAwNX0.puoM9plugDnFDF-0oiEVqJZVPuWlFYNxOeUQ7HrXI5Q';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, 
  },
});