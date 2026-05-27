import { createClient } from "@supabase/supabase-js";

/*
  Supabase Client Setup
  ---------------------
  This file connects your Next.js app to Supabase.

  It uses environment variables stored in .env.local:
*/

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/*
  Safety check:
  If these are missing, the app will warn you clearly.
*/
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Check your .env.local file."
  );
}

/*
  Create Supabase client
*/
export const supabase = createClient(supabaseUrl, supabaseAnonKey);