import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sejycarzcxnhjynkqrjo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlanljYXJ6Y3huaGp5bmtxcmpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxNTAxNDEsImV4cCI6MjEwNDcyNjE0MX0.DWJzTy00JxsDHTb2g0FPhWeYiCOTI8YjJO4-x31k25o';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
