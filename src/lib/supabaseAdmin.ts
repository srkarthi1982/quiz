import { createClient } from "@supabase/supabase-js";
export const supabaseAdmin = createClient(
  'https://sctrwvkpatgmkxqoabfd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjdHJ3dmtwYXRnbWt4cW9hYmZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTQzODEzOSwiZXhwIjoyMDU3MDE0MTM5fQ.IAwO2KWPvH4rT4fK2VmrcUVtrnNOvRDYzNmpMxs44NU', {
  auth: {
    flowType: "pkce",
    autoRefreshToken: true,
    detectSessionInUrl: true,
    persistSession: true,
  },
}
);