import { createClient } from "@supabase/supabase-js";
export const supabase = createClient(
  'https://sctrwvkpatgmkxqoabfd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjdHJ3dmtwYXRnbWt4cW9hYmZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE0MzgxMzksImV4cCI6MjA1NzAxNDEzOX0.McJ8vR7z0Wv_E74p6Thc04EtEotUb1IW8TuuhBb2v7E', {
  auth: {
    flowType: "pkce",
    autoRefreshToken: true,
    detectSessionInUrl: true,
    persistSession: true,
  },
}
);