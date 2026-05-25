/**
 * Supabase client — see supabase.example.js for setup instructions.
 *
 * IMPORTANT: This file is listed in .gitignore. If you see it in git history,
 * rotate your Supabase anon key at:
 *   https://app.supabase.com → Project Settings → API → Regenerate key
 *
 * The anon key is safe for client-side use ONLY when Supabase Row Level Security
 * (RLS) is enabled on every table. Verify RLS is on before deploying.
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://jajbrbypvwdvrubbafcn.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphamJyYnlwdndkdnJ1YmJhZmNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NDE1MTUsImV4cCI6MjA5MzQxNzUxNX0.BamVCGH2hMOi-lmSUw78FAqoPCXP4bijnfOJvIyzQeo'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
