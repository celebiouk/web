import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

let supabase: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Creates a Supabase client for use in Client Components
 * Use this in components with 'use client' directive
 * Uses a singleton pattern to avoid creating multiple clients
 */
export function createClient() {
  if (supabase) return supabase;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase environment variables are not set. ' +
      'Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are defined.'
    );
  }

  supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  return supabase;
}
